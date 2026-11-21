"use client";

import React, { useCallback, useMemo, useState } from "react";
import { StopCircle } from "lucide-react";
import { faDAndD } from "@fortawesome/free-brands-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import AudioPlayer from "@/components/AudioPlayer";
import MixerBar from "@/components/MixerBar";
import { ThemeToggle } from "@/components/ToogleDark";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { setCategoryVolume } from "@/lib/audio-engine";
import {
  getDefaultCategoryVolumes,
  type SoundCategory,
} from "@/lib/sound-categories";
import { ambientAudioFiles, effectsAudioFiles, musicAudioFiles } from "@/lib/audioFiles";

type AudioFile = {
  name: string;
  url: string;
  isLooping: boolean;
  license: string;
};

type AudioSectionDefinition = {
  title: string;
  files: AudioFile[];
};

type AudioSectionProps = PlaybackHandlers & {
  title?: string;
  audioFiles: AudioFile[];
  category: SoundCategory;
};

type PlaybackHandlers = {
  stopAllToken: number;
  stopTokens: Record<SoundCategory, number>;
  onPlay: (url: string, name: string, category: SoundCategory) => void;
  onStop: (url: string) => void;
};

const SFX_SECTIONS: AudioSectionDefinition[] = [
  { title: "Naturaleza", files: effectsAudioFiles.nature },
  { title: "Animales", files: effectsAudioFiles.animales },
  { title: "Acciones y objetos", files: effectsAudioFiles.acciones },
  { title: "Dragones", files: effectsAudioFiles.dragones },
  { title: "Combate y batallas", files: effectsAudioFiles.batallas },
  { title: "Personas y reacciones", files: effectsAudioFiles.personas },
  { title: "Monstruos", files: effectsAudioFiles.monstruos },
];

const MUSIC_SECTIONS: AudioSectionDefinition[] = [
  { title: "Música para Eventos y Situaciones", files: musicAudioFiles.events },
  { title: "Música para Combates", files: musicAudioFiles.combat },
  { title: "Música para Lugares Notables", files: musicAudioFiles.places },
  { title: "Música para Mazmorras", files: musicAudioFiles.dungeons },
  { title: "Música para Tavernas", files: musicAudioFiles.tavern },
  { title: "Música para Ciudades y Villas", files: musicAudioFiles.cities },
  { title: "Música para Planos Existenciales", files: musicAudioFiles.planes },
];

const AudioSection = ({
  title,
  audioFiles,
  category,
  stopAllToken,
  stopTokens,
  onPlay,
  onStop,
}: AudioSectionProps) => (
  <div>
    {title && <h3 className="text-lg font-semibold mb-2">{title}</h3>}
    <div className="space-y-2">
      {audioFiles.map((audio) => (
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
  </div>
);

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

  return (
    <>
      <Card className="w-full min-h-screen pb-56 sm:pb-24">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="space-x-2">
              <FontAwesomeIcon icon={faDAndD} className="text-2xl" />
              <span className="text-2xl">D&D Soundboard</span>
            </CardTitle>
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <Button onClick={stopAllTracks} variant="destructive" size="sm">
                <StopCircle className="mr-2 h-4 w-4" />
                Detener Todo
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Columna izquierda: Ambiente */}
            <div className="lg:w-1/3">
              <AudioSection
                title="Ambiente"
                audioFiles={ambientAudioFiles}
                category="ambient"
                {...playbackHandlers}
              />
            </div>
            {/* Columna central: Efectos de sonido */}
            <div className="lg:w-1/3 space-y-3">
              {SFX_SECTIONS.map((section) => (
                <AccordionSection key={section.title} title={section.title}>
                  <AudioSection
                    audioFiles={section.files}
                    category="sfx"
                    {...playbackHandlers}
                  />
                </AccordionSection>
              ))}
            </div>
            {/* Columna derecha: Música */}
            <div className="lg:w-1/3 space-y-3">
              {MUSIC_SECTIONS.map((section) => (
                <AccordionSection key={section.title} title={section.title}>
                  <AudioSection
                    audioFiles={section.files}
                    category="music"
                    {...playbackHandlers}
                  />
                </AccordionSection>
              ))}
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col items-start text-sm text-muted-foreground">
          <p className="mb-2">Información:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>
              La mayor parte de Música y Ambientación que utilizo pertenece al canal de YouTube:{" "}
              <a href="https://www.youtube.com/@bardify">Bardify</a>.
            </li>
            <li>
              Los efectos de sonido los he colectando con el tiempo y de algunos no recuerdo su
              procedencia.
            </li>
            <li>
              D&D Soundboard es contenido de fans no oficial permitido por la Política de contenido
              de fans. No está aprobado ni respaldado por Wizards of the Coast.
            </li>
          </ul>
        </CardFooter>
      </Card>
      <MixerBar
        volumes={volumes}
        activeCounts={activeCounts}
        onVolumeChange={handleCategoryVolumeChange}
        onStopCategory={stopCategory}
      />
    </>
  );
};

export default RPGSoundboard;
