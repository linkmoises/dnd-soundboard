"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { LoaderCircle, StopCircle } from "lucide-react";
import { faDAndD } from "@fortawesome/free-brands-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import AudioCard from "@/components/AudioCard";
import AudioPlayer from "@/components/AudioPlayer";
import MixerBar from "@/components/MixerBar";
import { ThemeToggle } from "@/components/ToogleDark";
import { Button } from "@/components/ui/button";
import { setCategoryVolume } from "@/lib/audio-engine";
import {
  getDefaultCategoryVolumes,
  type SoundCategory,
} from "@/lib/sound-categories";
import {
  TRACKS_MANIFEST_URL,
  parseTracksManifest,
  type SoundboardCatalog,
  type Track,
  type TrackGroup,
} from "@/lib/tracks";

type AudioSectionProps = PlaybackHandlers & {
  tracks: Track[];
  category: SoundCategory;
};

type PlaybackHandlers = {
  stopAllToken: number;
  stopTokens: Record<SoundCategory, number>;
  onPlay: (url: string, name: string, category: SoundCategory) => void;
  onStop: (url: string) => void;
};

type CatalogState =
  | { status: "loading" }
  | { status: "ready"; catalog: SoundboardCatalog }
  | { status: "error"; errors: string[] };

const AudioSection = ({
  tracks,
  category,
  stopAllToken,
  stopTokens,
  onPlay,
  onStop,
}: AudioSectionProps) => {
  if (tracks.length === 0) {
    return <p className="text-sm text-muted-foreground">Sin pistas.</p>;
  }

  return (
    <div className="space-y-2">
      {tracks.map((audio) => (
        <AudioPlayer
          key={audio.url}
          name={audio.name}
          url={audio.url}
          license={audio.license}
          category={category}
          isLooping={audio.isLooping}
          stopAllToken={stopAllToken}
          categoryStopToken={stopTokens[category]}
          onPlay={onPlay}
          onStop={onStop}
        />
      ))}
    </div>
  );
};

const AccordionSection = ({ title, children }: { title: string; children: React.ReactNode }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="border-b">
      <button
        className="w-full text-lg font-semibold py-2 flex justify-between items-center"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {title}
        <span>{isExpanded ? "-" : "+"}</span>
      </button>
      {isExpanded && <div className="py-2">{children}</div>}
    </div>
  );
};

const GroupColumn = ({
  groups,
  category,
  playbackHandlers,
}: {
  groups: TrackGroup[];
  category: SoundCategory;
  playbackHandlers: PlaybackHandlers;
}) => {
  if (groups.length === 0) {
    return <p className="text-sm text-muted-foreground">Sin grupos.</p>;
  }

  return (
    <>
      {groups.map((group, index) => (
        <AccordionSection key={`${group.title}-${index}`} title={group.title}>
          <AudioSection
            tracks={group.tracks}
            category={category}
            {...playbackHandlers}
          />
        </AccordionSection>
      ))}
    </>
  );
};

const fetchCatalogState = async (): Promise<CatalogState> => {
  try {
    const response = await fetch(TRACKS_MANIFEST_URL, { cache: "no-store" });

    if (!response.ok) {
      return {
        status: "error",
        errors: [`No se pudo leer ${TRACKS_MANIFEST_URL} (HTTP ${response.status}).`],
      };
    }

    const { catalog, errors } = parseTracksManifest(await response.text());

    if (!catalog) {
      return { status: "error", errors };
    }

    return { status: "ready", catalog };
  } catch (error) {
    return {
      status: "error",
      errors: [
        `No se pudo leer ${TRACKS_MANIFEST_URL}: ${
          error instanceof Error ? error.message : "error desconocido"
        }.`,
      ],
    };
  }
};

const RPGSoundboard = () => {
  const [activeTracks, setActiveTracks] = useState<
    Record<string, { name: string; category: SoundCategory }>
  >({});
  const [volumes, setVolumes] = useState<Record<SoundCategory, number>>(
    getDefaultCategoryVolumes
  );
  const [stopAllToken, setStopAllToken] = useState(0);
  const [stopTokens, setStopTokens] = useState<Record<SoundCategory, number>>({
    ambient: 0,
    music: 0,
    sfx: 0,
  });
  const [catalogState, setCatalogState] = useState<CatalogState>({ status: "loading" });

  const reloadCatalog = useCallback(() => {
    setCatalogState({ status: "loading" });
    void fetchCatalogState().then(setCatalogState);
  }, []);

  useEffect(() => {
    let active = true;

    void fetchCatalogState().then((state) => {
      if (active) {
        setCatalogState(state);
      }
    });

    return () => {
      active = false;
    };
  }, []);

  const handlePlay = useCallback((url: string, name: string, category: SoundCategory) => {
    setActiveTracks((previous) =>
      previous[url] ? previous : { ...previous, [url]: { name, category } }
    );
  }, []);

  const handleStop = useCallback((url: string) => {
    setActiveTracks((previous) => {
      if (!previous[url]) {
        return previous;
      }

      const next = { ...previous };
      delete next[url];
      return next;
    });
  }, []);

  const stopAllTracks = () => {
    setStopAllToken((token) => token + 1);
  };

  const stopCategory = (category: SoundCategory) => {
    setStopTokens((tokens) => ({ ...tokens, [category]: tokens[category] + 1 }));
  };

  const handleCategoryVolumeChange = (category: SoundCategory, volume: number) => {
    setVolumes((previous) => ({ ...previous, [category]: volume }));
    setCategoryVolume(category, volume / 100);
  };

  const activeCounts = useMemo(() => {
    const counts: Record<SoundCategory, number> = { ambient: 0, music: 0, sfx: 0 };

    Object.values(activeTracks).forEach(({ category }) => {
      counts[category] += 1;
    });

    return counts;
  }, [activeTracks]);

  const playbackHandlers: PlaybackHandlers = {
    stopAllToken,
    stopTokens,
    onPlay: handlePlay,
    onStop: handleStop,
  };

  const renderBoard = () => {
    if (catalogState.status === "loading") {
      return (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <LoaderCircle className="h-4 w-4 animate-spin" />
          Cargando pistas…
        </p>
      );
    }

    if (catalogState.status === "error") {
      return (
        <div
          role="alert"
          className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm"
        >
          <p className="mb-2 font-semibold text-destructive">
            No se pudo cargar el catálogo de pistas
          </p>
          <p className="mb-2 text-muted-foreground">
            Revisa <code className="rounded bg-muted px-1 py-0.5">public/tracks.yml</code>:
          </p>
          <ul className="list-inside list-disc space-y-1">
            {catalogState.errors.map((message, index) => (
              <li key={`${message}-${index}`}>{message}</li>
            ))}
          </ul>
          <Button
            className="mt-4"
            variant="outline"
            size="sm"
            onClick={reloadCatalog}
          >
            Reintentar
          </Button>
        </div>
      );
    }

    const { catalog } = catalogState;

    return (
      <>
        <div className="flex flex-col gap-6 lg:flex-row">
          {/* Columna izquierda: Ambiente */}
          <div className="lg:w-1/3">
            <h3 className="text-lg font-semibold mb-2">Ambiente</h3>
            {catalog.ambient.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin pistas.</p>
            ) : (
              <div className="grid auto-rows-fr grid-cols-3 gap-3">
                {catalog.ambient.map((audio) => (
                  <AudioCard
                    key={audio.url}
                    name={audio.name}
                    url={audio.url}
                    license={audio.license}
                    category="ambient"
                    isLooping={audio.isLooping}
                    stopAllToken={playbackHandlers.stopAllToken}
                    categoryStopToken={playbackHandlers.stopTokens.ambient}
                    onPlay={playbackHandlers.onPlay}
                    onStop={playbackHandlers.onStop}
                  />
                ))}
              </div>
            )}
          </div>
          {/* Columna central: Efectos de sonido */}
          <div className="lg:w-1/3 space-y-3">
            <GroupColumn
              groups={catalog.sfx}
              category="sfx"
              playbackHandlers={playbackHandlers}
            />
          </div>
          {/* Columna derecha: Música */}
          <div className="lg:w-1/3 space-y-3">
            <GroupColumn
              groups={catalog.music}
              category="music"
              playbackHandlers={playbackHandlers}
            />
          </div>
        </div>
        <footer className="border-t pt-4 text-sm text-muted-foreground">
          <p className="mb-2 font-medium text-foreground">Información:</p>
          <ul className="list-inside list-disc space-y-1">
            <li>
              La mayor parte de Música y Ambientación que utilizo pertenece al canal de YouTube:{" "}
              <a href="https://www.youtube.com/@bardify">Bardify</a>.
            </li>
            <li>
              Los efectos de sonido los he colectando con el tiempo y de algunos no recuerdo su
              procedencia.
            </li>
            <li>
              D&amp;D Soundboard es contenido de fans no oficial permitido por la Política de
              contenido de fans. No está aprobado ni respaldado por Wizards of the Coast.
            </li>
          </ul>
        </footer>
      </>
    );
  };

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <header className="shrink-0 border-b bg-background/95 backdrop-blur">
        <div className="flex w-full items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight sm:text-2xl">
            <FontAwesomeIcon icon={faDAndD} className="text-2xl" />
            <span>D&amp;D Soundboard</span>
          </h1>
          <div className="flex items-center gap-2 sm:gap-4">
            <ThemeToggle />
            <Button onClick={stopAllTracks} variant="destructive" size="sm">
              <StopCircle className="mr-2 h-4 w-4" />
              Detener Todo
            </Button>
          </div>
        </div>
      </header>
      <MixerBar
        volumes={volumes}
        activeCounts={activeCounts}
        onVolumeChange={handleCategoryVolumeChange}
        onStopCategory={stopCategory}
      />
      <main className="min-h-0 flex-1 overflow-y-auto">
        <div className="w-full space-y-8 px-4 py-6 sm:px-6">{renderBoard()}</div>
      </main>
    </div>
  );
};

export default RPGSoundboard;
