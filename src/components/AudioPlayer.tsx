"use client";

import { Pause, Play, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { CreditBadge } from "@/components/CreditBadge";
import { getAudioSources, getCardImage } from "@/lib/audio-sources";
import { useAudioTrack } from "@/hooks/useAudioTrack";
import { cn } from "@/lib/utils";
import type { SoundCategory } from "@/lib/sound-categories";

export type AudioPlayerProps = {
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

const AudioPlayer = ({
  name,
  url,
  license,
  category,
  isLooping = false,
  stopAllToken,
  categoryStopToken,
  onPlay,
  onStop,
}: AudioPlayerProps) => {
  const {
    audioProps,
    isPlaying,
    volume,
    loadFailed,
    togglePlay,
    handleVolumeChange,
  } = useAudioTrack({
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
    <div
      data-track={url}
      onClick={togglePlay}
      className={cn(
        "group relative flex cursor-pointer flex-col gap-1.5 rounded-lg border p-1.5 transition-colors duration-300",
        isPlaying ? "border-primary bg-primary/10" : "border-border bg-background hover:bg-accent/50"
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
        className="relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-sm bg-gradient-to-br from-primary/15 via-primary/5 to-transparent"
      >
        <Sparkles className="h-4 w-4 text-primary/30" strokeWidth={1.5} />
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url("${getCardImage(url)}")` }}
        />
      </div>
      <span
        title={name}
        className="line-clamp-2 min-h-[1.9rem] text-xs font-medium leading-tight"
      >
        {name}
      </span>
      <div className="flex items-center gap-1.5">
        <Button
          onClick={(event) => {
            event.stopPropagation();
            togglePlay();
          }}
          variant={isPlaying ? "default" : "outline"}
          size="icon"
          className="h-6 w-6 shrink-0 rounded-full"
          aria-label={isPlaying ? `Pausar ${name}` : `Reproducir ${name}`}
        >
          {isPlaying ? <Pause size={14} /> : <Play size={14} />}
        </Button>
        <div
          className="min-w-0 flex-1"
          onClick={(event) => event.stopPropagation()}
          onPointerDown={(event) => event.stopPropagation()}
        >
          <Slider
            compact
            value={[volume]}
            onValueChange={handleVolumeChange}
            max={100}
            min={0}
            step={1}
            aria-label={`Volumen de ${name}`}
          />
        </div>
      </div>
      <span
        className="absolute right-2 top-2 z-10"
        onClick={(event) => event.stopPropagation()}
      >
        <CreditBadge name={name}>
          <p className="text-sm">{license}</p>
          {loadFailed && (
            <p className="text-sm text-destructive">No se pudo reproducir el audio</p>
          )}
        </CreditBadge>
      </span>
    </div>
  );
};

export default AudioPlayer;
