import { SOUND_CATEGORIES, type SoundCategory } from "@/lib/sound-categories";

type AudioGraph = {
  context: AudioContext;
  categories: Record<SoundCategory, GainNode>;
};

export type TrackOutput = {
  /** Fade envelope (fade-in / fade-out). Always moves between 0 and 1. */
  fadeGain: GainNode;
  /** Per-track volume fader. */
  volumeGain: GainNode;
  disconnect: () => void;
};

export type TrackEnvelopeOptions = {
  fadeInMs: number;
  endFadeMs?: number | null;
  remainingMs?: number | null;
};

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

const categoryVolumes: Record<SoundCategory, number> = SOUND_CATEGORIES.reduce(
  (volumes, category) => ({ ...volumes, [category.id]: category.defaultVolume / 100 }),
  {} as Record<SoundCategory, number>
);

let graph: AudioGraph | null = null;

/**
 * Adjust an AudioParam without clicks. A duration of 0 applies the value
 * immediately instead of interpolating.
 */
const rampParam = (
  context: AudioContext,
  param: AudioParam,
  target: number,
  durationMs: number
) => {
  const now = context.currentTime;
  const value = clamp01(target);

  if (typeof param.cancelAndHoldAtTime === "function") {
    param.cancelAndHoldAtTime(now);
  } else {
    param.cancelScheduledValues(now);
    param.setValueAtTime(param.value, now);
  }

  if (durationMs <= 0) {
    param.setValueAtTime(value, now);
    return;
  }

  param.linearRampToValueAtTime(value, now + durationMs / 1000);
};

const ensureAudioGraph = (): AudioGraph | null => {
  if (typeof window === "undefined") {
    return null;
  }

  if (graph) {
    return graph;
  }

  const AudioContextCtor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

  if (!AudioContextCtor) {
    return null;
  }

  const context = new AudioContextCtor();
  const categories = {} as Record<SoundCategory, GainNode>;

  SOUND_CATEGORIES.forEach(({ id }) => {
    const categoryGain = context.createGain();
    categoryGain.gain.value = categoryVolumes[id];
    categoryGain.connect(context.destination);
    categories[id] = categoryGain;
  });

  graph = { context, categories };
  return graph;
};

/**
 * Browsers may create the AudioContext in a suspended state until a user
 * gesture happens, so every playback entry point goes through here.
 */
const resumeAudioGraph = (): AudioGraph | null => {
  const currentGraph = ensureAudioGraph();

  if (currentGraph && currentGraph.context.state === "suspended") {
    void currentGraph.context.resume();
  }

  return currentGraph;
};

/**
 * Category masters are shared by every track of the same category, so a single
 * ramp moves the whole group at once.
 */
export const setCategoryVolume = (category: SoundCategory, volume: number) => {
  categoryVolumes[category] = clamp01(volume);

  if (!graph) {
    return;
  }

  rampParam(graph.context, graph.categories[category].gain, categoryVolumes[category], 180);
};

/**
 * Connect a media element to its own fade envelope and volume fader, then to
 * the shared category master. Each element can only be routed once, so callers
 * must keep the returned output alive for the lifetime of the element.
 */
export const createTrackOutput = (
  element: HTMLAudioElement,
  category: SoundCategory
): TrackOutput | null => {
  const currentGraph = resumeAudioGraph();

  if (!currentGraph) {
    return null;
  }

  try {
    const source = currentGraph.context.createMediaElementSource(element);
    const fadeGain = currentGraph.context.createGain();
    const volumeGain = currentGraph.context.createGain();

    fadeGain.gain.value = 0;
    volumeGain.gain.value = 1;

    source.connect(fadeGain);
    fadeGain.connect(volumeGain);
    volumeGain.connect(currentGraph.categories[category]);

    return {
      fadeGain,
      volumeGain,
      disconnect: () => {
        [source, fadeGain, volumeGain].forEach((node) => {
          try {
            node.disconnect();
          } catch {
            // The node may already be disconnected.
          }
        });
      },
    };
  } catch (error) {
    console.error("No se pudo conectar el audio al motor de mezcla:", error);
    return null;
  }
};

export const setTrackVolume = (output: TrackOutput, volume: number, rampMs = 120) => {
  const currentGraph = ensureAudioGraph();

  if (!currentGraph) {
    return;
  }

  rampParam(currentGraph.context, output.volumeGain.gain, volume, rampMs);
};

export const fadeTrackEnvelope = (output: TrackOutput, target: number, durationMs: number) => {
  const currentGraph = ensureAudioGraph();

  if (!currentGraph) {
    return;
  }

  rampParam(currentGraph.context, output.fadeGain.gain, target, durationMs);
};

/**
 * Schedule the playback envelope on the audio clock: fade in, hold, then fade
 * out right before the track ends. Because it lives on the AudioParam timeline
 * it keeps its timing even if the tab throttles timers.
 */
export const startTrackEnvelope = (
  output: TrackOutput,
  { fadeInMs, endFadeMs, remainingMs }: TrackEnvelopeOptions
) => {
  const currentGraph = ensureAudioGraph();

  if (!currentGraph) {
    return;
  }

  const param = output.fadeGain.gain;
  const now = currentGraph.context.currentTime;
  const fadeInSeconds = Math.max(0, fadeInMs) / 1000;

  param.cancelScheduledValues(now);
  param.setValueAtTime(0, now);
  param.linearRampToValueAtTime(1, now + fadeInSeconds);

  const hasEndFade =
    typeof endFadeMs === "number" &&
    endFadeMs > 0 &&
    typeof remainingMs === "number" &&
    remainingMs > fadeInMs + endFadeMs;

  if (!hasEndFade) {
    return;
  }

  const fadeStart = now + (remainingMs - endFadeMs) / 1000;
  param.setValueAtTime(1, fadeStart);
  param.linearRampToValueAtTime(0, fadeStart + endFadeMs / 1000);
};
