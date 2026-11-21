"use client";

import type { ReactNode } from "react";
import { Info, Music2, Pause, Play, Sparkles, Wind } from "lucide-react";
import { getAudioSources, getCardImage } from "@/lib/audio-sources";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAudioTrack } from "@/hooks/useAudioTrack";
import { cn } from "@/lib/utils";
import type { SoundCategory } from "@/lib/sound-categories";

const CATEGORY_PLACEHOLDER_ICONS: Record<SoundCategory, ReactNode> = {
  ambient: <Wind className="h-1/3 w-1/3 text-primary/30" strokeWidth={1.5} />,
  music: <Music2 className="h-1/3 w-1/3 text-primary/30" strokeWidth={1.5} />,
  sfx: <Sparkles className="h-1/3 w-1/3 text-primary/30" strokeWidth={1.5} />,
};

export type AudioCardProps = {
  name: string;
  url: string;
  license: string;
  category: SoundCategory;
  isLooping?: boolean;
  stopAllToken: number;
  categoryStopToken: number;
  onPlay: (url: string, name: string, category: SoundCategory) => void;
  onStop: (url: string) => void;
};

const AudioCard = ({
  name,
  url,
  license,
  category,
  isLooping = false,
  stopAllToken,
  categoryStopToken,
  onPlay,
  onStop,
}: AudioCardProps) => {
  const image = getCardImage(url);

  const { audioProps, isPlaying, loadFailed, togglePlay } = useAudioTrack({
    name,
    url,
    category,
    isLooping,
    stopAllToken,
    categoryStopToken,
    onPlay,
    onStop,
  });

  return (
    <div className="relative flex h-full flex-col">
      <button
        type="button"
        data-track={url}
        onClick={togglePlay}
        aria-pressed={isPlaying}
        aria-label={isPlaying ? `Pausar ${name}` : `Reproducir ${name}`}
        className={cn(
          "group flex h-full w-full flex-col overflow-hidden rounded-lg border bg-background text-left transition-colors duration-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
          isPlaying
            ? "border-primary bg-primary/10"
            : "bg-background hover:border-primary/40 hover:bg-accent/40"
        )}
      >
        <audio {...audioProps}>
          {getAudioSources(url).map((source) => (
            <source key={source.src} src={source.src} type={source.type} />
          ))}
          Tu navegador no soporta el elemento de audio.
        </audio>
        <div
          aria-hidden
          className="relative flex aspect-square w-full items-center justify-center overflow-hidden bg-gradient-to-br from-primary/15 via-primary/5 to-transparent"
        >
          {CATEGORY_PLACEHOLDER_ICONS[category]}
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url("${image}")` }}
          />
        </div>
        <div className="flex min-h-[4rem] flex-1 flex-col gap-1.5 p-2">
          <div className="flex items-start gap-2">
            <span
              aria-hidden
              className={cn(
                "mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border transition-colors",
                isPlaying
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-foreground group-hover:border-primary/60"
              )}
            >
              {isPlaying ? <Pause size={12} /> : <Play size={12} />}
            </span>
            <span
              title={name}
              className="line-clamp-2 min-w-0 flex-1 break-words text-xs font-medium leading-snug"
            >
              {name}
            </span>
          </div>
          {loadFailed ? (
            <p className="mt-auto truncate text-[10px] text-destructive">
              No se pudo reproducir
            </p>
          ) : null}
        </div>
      </button>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              aria-label={`Ver crédito de ${name}`}
              className="absolute right-2 top-2 z-10 grid h-6 w-6 place-items-center rounded-full border border-border/60 bg-background/70 text-muted-foreground opacity-80 backdrop-blur transition-opacity hover:text-foreground hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <Info size={14} />
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-sm">{license}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};

export default AudioCard;
