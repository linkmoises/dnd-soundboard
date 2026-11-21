"use client";

import { Info, Pause, Play, Repeat, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getAudioSources } from "@/lib/audio-sources";
import { useAudioTrack } from "@/hooks/useAudioTrack";
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
    replay,
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
      className={`flex items-center space-x-4 p-2 border rounded-lg transition-colors duration-300 ${
        isPlaying ? "bg-primary/10 border-primary" : "bg-background hover:bg-accent/50"
      }`}
    >
      <audio {...audioProps}>
        {getAudioSources(url).map((source) => (
          <source key={source.src} src={source.src} type={source.type} />
        ))}
        Tu navegador no soporta el elemento de audio.
      </audio>
      <Button
        onClick={togglePlay}
        variant={isPlaying ? "default" : "outline"}
        size="icon"
        aria-label={isPlaying ? `Pausar ${name}` : `Reproducir ${name}`}
      >
        {isPlaying ? <Pause size={20} /> : <Play size={20} />}
      </Button>
      {!isLooping && (
        <Button
          onClick={replay}
          variant="outline"
          size="icon"
          aria-label={`Repetir ${name}`}
        >
          <Repeat size={20} />
        </Button>
      )}
      <div className="flex items-center space-x-2 flex-1">
        <Volume2 size={20} className="shrink-0" />
        <Slider
          value={[volume]}
          onValueChange={handleVolumeChange}
          max={100}
          min={0}
          step={1}
        />
      </div>
      <div className="flex items-center space-x-2">
        <span className="text-sm font-medium">{name}</span>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon">
                <Info size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-sm">{license}</p>
              {loadFailed && (
                <p className="text-sm text-destructive">No se pudo reproducir el audio</p>
              )}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
};

export default AudioPlayer;
