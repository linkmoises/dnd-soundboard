"use client";

import React from "react";
import { Music2, Sparkles, Wind, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { SOUND_CATEGORIES, type SoundCategory } from "@/lib/sound-categories";
import { cn } from "@/lib/utils";

const CATEGORY_ICONS: Record<SoundCategory, React.ReactNode> = {
  ambient: <Wind size={18} />,
  music: <Music2 size={18} />,
  sfx: <Sparkles size={18} />,
};

export type MixerBarProps = {
  volumes: Record<SoundCategory, number>;
  activeCounts: Record<SoundCategory, number>;
  onVolumeChange: (category: SoundCategory, volume: number) => void;
  onStopCategory: (category: SoundCategory) => void;
};

export const MixerBar = ({
  volumes,
  activeCounts,
  onVolumeChange,
  onStopCategory,
}: MixerBarProps) => {
  return (
    <div className="shrink-0 border-b bg-background/95 backdrop-blur">
      <div className="grid w-full gap-3 p-3 sm:grid-cols-3">
        {SOUND_CATEGORIES.map((category) => {
          const count = activeCounts[category.id];
          const isActive = count > 0;

          return (
            <div
              key={category.id}
              className={cn(
                "flex items-center gap-3 rounded-lg border px-3 py-2 transition-colors",
                isActive ? "border-primary/50 bg-primary/5" : "opacity-60"
              )}
            >
              <span className={cn("shrink-0", isActive ? "text-primary" : "text-muted-foreground")}>
                {CATEGORY_ICONS[category.id]}
              </span>
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center justify-between gap-2 text-xs font-medium">
                  <span className="truncate">{category.label}</span>
                  <span className="shrink-0 tabular-nums text-muted-foreground">
                    {count} {count === 1 ? "activo" : "activos"}
                  </span>
                </div>
                <Slider
                  value={[volumes[category.id]]}
                  onValueChange={(value) => onVolumeChange(category.id, value[0] ?? 0)}
                  max={100}
                  min={0}
                  step={1}
                />
              </div>
              <span className="w-9 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                {volumes[category.id]}%
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onStopCategory(category.id)}
                disabled={!isActive}
                aria-label={`Detener ${category.label}`}
                title={`Detener ${category.label}`}
              >
                <X size={16} />
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MixerBar;
