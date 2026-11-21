import { parseDocument } from "yaml";

export type Track = {
  name: string;
  url: string;
  license: string;
  isLooping: boolean;
};

export type TrackGroup = {
  title: string;
  tracks: Track[];
};

export type SoundboardCatalog = {
  ambient: Track[];
  sfx: TrackGroup[];
  music: TrackGroup[];
};

export type CatalogParseResult = {
  catalog: SoundboardCatalog | null;
  errors: string[];
};

/** The manifest is served straight from public/, so edits apply on reload. */
export const TRACKS_MANIFEST_URL = "/tracks.yml";

const TOP_LEVEL_KEYS = ["defaults", "ambient", "sfx", "music"] as const;
const DEFAULT_KEYS = ["license", "loop"] as const;
const AMBIENT_KEYS = ["license", "loop", "tracks"] as const;
const GROUPED_SECTION_KEYS = ["license", "loop", "groups"] as const;
const GROUP_KEYS = ["title", "license", "loop", "tracks"] as const;
const TRACK_KEYS = ["name", "file", "license", "loop"] as const;

const AUDIO_EXTENSION = /\.(opus|mp3|wav|ogg)$/i;

type Inherited = {
  license?: string;
  loop?: boolean;
};

type ParseContext = {
  errors: string[];
  seenUrls: Map<string, string>;
  defaults: Inherited;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const readString = (value: unknown): string | null => {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
};

const readBoolean = (value: unknown): boolean | null =>
  typeof value === "boolean" ? value : null;

const readRequiredText = (
  value: unknown,
  path: string,
  messages: { missing: string; invalid: string },
  errors: string[]
): string | null => {
  if (value === undefined || value === null) {
    errors.push(`${path}: ${messages.missing}`);
    return null;
  }

  const text = readString(value);

  if (!text) {
    errors.push(`${path}: ${messages.invalid}`);
  }

  return text;
};

const reportUnknownKeys = (
  record: Record<string, unknown>,
  allowed: readonly string[],
  path: string,
  errors: string[]
) => {
  Object.keys(record).forEach((key) => {
    if (!allowed.includes(key)) {
      errors.push(`${path}: campo desconocido "${key}".`);
    }
  });
};

/** `file` is relative to /audio/ unless it already starts with a slash. */
export const resolveAudioUrl = (file: string) => {
  const trimmed = file.trim();
  const absolute = trimmed.startsWith("/") ? trimmed : `/audio/${trimmed}`;
  return absolute.replace(AUDIO_EXTENSION, "");
};

const readInherited = (
  record: Record<string, unknown>,
  path: string,
  inherited: Inherited,
  errors: string[]
): Inherited => {
  const next: Inherited = { ...inherited };

  if (record.license !== undefined) {
    const license = readString(record.license);

    if (license) {
      next.license = license;
    } else {
      errors.push(`${path}.license: debe ser un texto no vacío.`);
    }
  }

  if (record.loop !== undefined) {
    const loop = readBoolean(record.loop);

    if (loop !== null) {
      next.loop = loop;
    } else {
      errors.push(`${path}.loop: debe ser true o false.`);
    }
  }

  return next;
};

const readTrack = (
  value: unknown,
  path: string,
  inherited: Inherited,
  context: ParseContext
): Track | null => {
  if (!isRecord(value)) {
    context.errors.push(`${path}: debe ser un objeto con "name" y "file".`);
    return null;
  }

  reportUnknownKeys(value, TRACK_KEYS, path, context.errors);

  const name = readRequiredText(
    value.name,
    `${path}.name`,
    { missing: "falta el nombre de la pista.", invalid: "debe ser un texto no vacío." },
    context.errors
  );
  const file = readRequiredText(
    value.file,
    `${path}.file`,
    { missing: "falta el archivo de audio.", invalid: "debe ser un texto no vacío." },
    context.errors
  );
  const resolved = readInherited(value, path, inherited, context.errors);

  if (!resolved.license) {
    context.errors.push(
      `${path}.license: falta la licencia (defínela en defaults, la sección, el grupo o la pista).`
    );
  }

  if (!name || !file || !resolved.license) {
    return null;
  }

  const url = resolveAudioUrl(file);
  const previousPath = context.seenUrls.get(url);

  if (previousPath) {
    context.errors.push(`${path}: el audio ${url} ya está declarado en ${previousPath}.`);
    return null;
  }

  context.seenUrls.set(url, path);

  return {
    name,
    url,
    license: resolved.license,
    isLooping: resolved.loop ?? false,
  };
};

const readTrackList = (
  value: unknown,
  path: string,
  inherited: Inherited,
  context: ParseContext
): Track[] => {
  if (value === undefined) {
    context.errors.push(`${path}: falta la lista de pistas.`);
    return [];
  }

  if (!Array.isArray(value)) {
    context.errors.push(`${path}: debe ser una lista de pistas.`);
    return [];
  }

  return value
    .map((item, index) => readTrack(item, `${path}[${index}]`, inherited, context))
    .filter((track): track is Track => track !== null);
};

const readGroups = (
  value: unknown,
  path: string,
  inherited: Inherited,
  context: ParseContext
): TrackGroup[] => {
  if (value === undefined) {
    context.errors.push(`${path}: falta la lista de grupos.`);
    return [];
  }

  if (!Array.isArray(value)) {
    context.errors.push(`${path}: debe ser una lista de grupos.`);
    return [];
  }

  return value
    .map((item, index) => {
      const groupPath = `${path}[${index}]`;

      if (!isRecord(item)) {
        context.errors.push(`${groupPath}: debe ser un objeto con "title" y "tracks".`);
        return null;
      }

      reportUnknownKeys(item, GROUP_KEYS, groupPath, context.errors);

      const title = readString(item.title);

      if (!title) {
        context.errors.push(`${groupPath}.title: falta el título del grupo.`);
      }

      const groupInherited = readInherited(item, groupPath, inherited, context.errors);
      const tracks = readTrackList(item.tracks, `${groupPath}.tracks`, groupInherited, context);

      return title ? { title, tracks } : null;
    })
    .filter((group): group is TrackGroup => group !== null);
};

const readSectionRecord = (
  value: unknown,
  path: string,
  allowedKeys: readonly string[],
  context: ParseContext
): Record<string, unknown> | null => {
  // A missing section is already reported by the caller as "falta la sección".
  if (value === undefined) {
    return null;
  }

  if (!isRecord(value)) {
    context.errors.push(`${path}: debe ser un objeto.`);
    return null;
  }

  reportUnknownKeys(value, allowedKeys, path, context.errors);
  return value;
};

export const parseTracksManifest = (source: string): CatalogParseResult => {
  const document = parseDocument(source);

  if (document.errors.length > 0) {
    return {
      catalog: null,
      errors: document.errors.map((error) => `YAML: ${error.message}`),
    };
  }

  const raw: unknown = document.toJS();

  if (!isRecord(raw)) {
    return {
      catalog: null,
      errors: [
        "El catálogo debe ser un objeto YAML con las secciones ambient, sfx y music (y opcionalmente defaults).",
      ],
    };
  }

  const context: ParseContext = { errors: [], seenUrls: new Map(), defaults: {} };

  reportUnknownKeys(raw, TOP_LEVEL_KEYS, "catálogo", context.errors);

  const rawDefaults = raw.defaults;

  if (rawDefaults !== undefined) {
    const defaultsRecord = readSectionRecord(rawDefaults, "defaults", DEFAULT_KEYS, context);

    if (defaultsRecord) {
      context.defaults = readInherited(defaultsRecord, "defaults", {}, context.errors);
    }
  }

  const missingSections = TOP_LEVEL_KEYS.filter(
    (key) => key !== "defaults" && raw[key] === undefined
  );

  missingSections.forEach((key) => {
    context.errors.push(`${key}: falta la sección ${key}.`);
  });

  const ambientRecord = readSectionRecord(raw.ambient, "ambient", AMBIENT_KEYS, context);
  const ambientInherited = ambientRecord
    ? readInherited(ambientRecord, "ambient", context.defaults, context.errors)
    : context.defaults;
  const ambientTracks = ambientRecord
    ? readTrackList(ambientRecord.tracks, "ambient.tracks", ambientInherited, context)
    : [];

  const readGroupedSection = (key: "sfx" | "music"): TrackGroup[] => {
    const record = readSectionRecord(raw[key], key, GROUPED_SECTION_KEYS, context);

    if (!record) {
      return [];
    }

    const inherited = readInherited(record, key, context.defaults, context.errors);
    return readGroups(record.groups, `${key}.groups`, inherited, context);
  };

  const sfxGroups = readGroupedSection("sfx");
  const musicGroups = readGroupedSection("music");

  if (context.errors.length > 0) {
    return { catalog: null, errors: context.errors };
  }

  return {
    catalog: { ambient: ambientTracks, sfx: sfxGroups, music: musicGroups },
    errors: [],
  };
};
