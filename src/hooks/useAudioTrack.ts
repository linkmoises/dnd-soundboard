"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  createTrackOutput,
  fadeTrackEnvelope,
  setTrackVolume,
  startTrackEnvelope,
  type TrackOutput,
} from "@/lib/audio-engine";
import type { SoundCategory } from "@/lib/sound-categories";

const FADE_IN_MS = 1500;
const FADE_OUT_MS = 1200;
const END_FADE_MAX_MS = 2000;
const END_FADE_MIN_MS = 400;
const END_FADE_RATIO = 0.2;
const VOLUME_RAMP_MS = 120;

export const DEFAULT_TRACK_VOLUME = 70;

export type UseAudioTrackOptions = {
  name: string;
  url: string;
  category: SoundCategory;
  isLooping?: boolean;
  stopAllToken: number;
  categoryStopToken: number;
  onPlay: (url: string, name: string, category: SoundCategory) => void;
  onStop: (url: string) => void;
};

export const useAudioTrack = ({
  name,
  url,
  category,
  isLooping = false,
  stopAllToken,
  categoryStopToken,
  onPlay,
  onStop,
}: UseAudioTrackOptions) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(DEFAULT_TRACK_VOLUME);
  const [loadFailed, setLoadFailed] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const outputRef = useRef<TrackOutput | null>(null);
  const stopTimeoutRef = useRef<number | null>(null);
  const isPlayingRef = useRef(false);
  const volumeRef = useRef(DEFAULT_TRACK_VOLUME);

  const clearStopTimeout = useCallback(() => {
    if (stopTimeoutRef.current !== null) {
      window.clearTimeout(stopTimeoutRef.current);
      stopTimeoutRef.current = null;
    }
  }, []);

  const ensureOutput = useCallback((): TrackOutput | null => {
    if (outputRef.current) {
      return outputRef.current;
    }

    const element = audioRef.current;

    if (!element) {
      return null;
    }

    const output = createTrackOutput(element, category);
    outputRef.current = output;

    if (output) {
      setTrackVolume(output, volumeRef.current / 100, 0);
    } else {
      element.volume = volumeRef.current / 100;
    }

    return output;
  }, [category]);

  const finishStop = useCallback(
    (notify: boolean) => {
      clearStopTimeout();

      const element = audioRef.current;
      const output = outputRef.current;

      if (element) {
        element.pause();
        element.currentTime = 0;
      }

      if (output) {
        fadeTrackEnvelope(output, 0, 0);
      }

      if (isPlayingRef.current) {
        isPlayingRef.current = false;
        setIsPlaying(false);

        if (notify) {
          onStop(url);
        }
      }
    },
    [clearStopTimeout, onStop, url]
  );

  const stopPlayback = useCallback(() => {
    const element = audioRef.current;
    const output = outputRef.current;

    if (!element || !isPlayingRef.current) {
      finishStop(false);
      return;
    }

    if (!output) {
      finishStop(true);
      return;
    }

    fadeTrackEnvelope(output, 0, FADE_OUT_MS);
    clearStopTimeout();
    stopTimeoutRef.current = window.setTimeout(() => finishStop(true), FADE_OUT_MS + 80);
  }, [clearStopTimeout, finishStop]);

  const startPlayback = useCallback(() => {
    const element = audioRef.current;

    if (!element) {
      return;
    }

    clearStopTimeout();

    if (element.ended) {
      element.currentTime = 0;
    }

    element.loop = isLooping;

    const output = ensureOutput();
    const targetVolume = volumeRef.current / 100;

    if (output) {
      fadeTrackEnvelope(output, 0, 0);
    } else {
      element.volume = targetVolume;
    }

    element
      .play()
      .then(() => {
        if (output) {
          const duration = element.duration;
          const hasDuration = Number.isFinite(duration) && duration > 0;
          const remainingMs = hasDuration
            ? Math.max(0, (duration - element.currentTime) * 1000)
            : null;
          const endFadeMs =
            hasDuration && !isLooping
              ? Math.min(
                  END_FADE_MAX_MS,
                  Math.max(END_FADE_MIN_MS, duration * 1000 * END_FADE_RATIO)
                )
              : null;

          startTrackEnvelope(output, {
            fadeInMs: FADE_IN_MS,
            endFadeMs,
            remainingMs,
          });
        }

        isPlayingRef.current = true;
        setIsPlaying(true);
        setLoadFailed(false);
        onPlay(url, name, category);
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        console.error(`Error al reproducir ${name}:`, error);
        setLoadFailed(true);

        if (output) {
          fadeTrackEnvelope(output, 0, 0);
        }
      });
  }, [category, clearStopTimeout, ensureOutput, isLooping, name, onPlay, url]);

  const togglePlay = useCallback(() => {
    if (isPlayingRef.current) {
      stopPlayback();
    } else {
      startPlayback();
    }
  }, [startPlayback, stopPlayback]);

  const handleVolumeChange = (value: number[]) => {
    const nextVolume = value[0] ?? 0;

    setVolume(nextVolume);
    volumeRef.current = nextVolume;

    const output = outputRef.current;
    const element = audioRef.current;

    if (output) {
      setTrackVolume(output, nextVolume / 100, VOLUME_RAMP_MS);
      return;
    }

    if (element) {
      element.volume = nextVolume / 100;
    }
  };

  const handleEnded = () => {
    finishStop(true);
  };

  const handleError = (event: React.SyntheticEvent<HTMLAudioElement>) => {
    console.error(`Error cargando el audio ${name}:`, event);
    setLoadFailed(true);
    finishStop(false);
  };

  const stopRef = useRef(stopPlayback);

  useEffect(() => {
    stopRef.current = stopPlayback;
  }, [stopPlayback]);

  useEffect(() => {
    if (stopAllToken > 0) {
      stopRef.current();
    }
  }, [stopAllToken]);

  useEffect(() => {
    if (categoryStopToken > 0) {
      stopRef.current();
    }
  }, [categoryStopToken]);

  useEffect(() => {
    return () => {
      if (stopTimeoutRef.current !== null) {
        window.clearTimeout(stopTimeoutRef.current);
      }

      outputRef.current?.disconnect();
      outputRef.current = null;
    };
  }, []);

  return {
    audioProps: {
      ref: audioRef,
      preload: "none" as const,
      onError: handleError,
      onEnded: handleEnded,
    },
    isPlaying,
    volume,
    loadFailed,
    togglePlay,
    handleVolumeChange,
  };
};
