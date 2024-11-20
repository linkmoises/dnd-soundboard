"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Volume2, Volume1, VolumeX, Play, Pause, Repeat, Info, StopCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ThemeToggle } from "@/components/ToogleDark"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDAndD } from '@fortawesome/free-brands-svg-icons';

const AudioPlayer = ({ name, url, isLooping = false, license, onPlay, onStop, stopAll }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(50);
  const [fadeInterval, setFadeInterval] = useState(null);
  const [canPlay, setCanPlay] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    if (stopAll && audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      onStop(name);
    }
  }, [stopAll, name, onStop]);

  const handleEnded = () => {
    setIsPlaying(false);
    if (onStop) onStop(name);
  };

  const getAudioSources = (baseUrl) => {
    const formats = [
      { type: 'audio/ogg; codecs="opus"', ext: 'opus' },
    ];
    
    const baseUrlWithoutExt = baseUrl.replace(/\.[^/.]+$/, '');
    
    return formats.map(format => ({
      src: `${baseUrlWithoutExt}.${format.ext}`,
      type: format.type
    }));
  };

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
      audioRef.current.loop = isLooping;
    }
  }, [volume, isLooping]);

  const fadeOut = (callback) => {
    let currentVolume = audioRef.current.volume;
    const fadeInterval = setInterval(() => {
      currentVolume = Math.max(0, currentVolume - 0.05);
      audioRef.current.volume = currentVolume;
      
      if (currentVolume <= 0) {
        clearInterval(fadeInterval);
        if (callback) callback();
      }
    }, 50);
    setFadeInterval(fadeInterval);
  };

  const togglePlay = () => {
    if (audioRef.current?.paused) {
      audioRef.current.volume = volume / 100;
      audioRef.current.loop = isLooping;
      audioRef.current.play().catch(error => {
        console.error('Error playing audio:', error);
      });
      setIsPlaying(true);
      if (onPlay) onPlay(name);
    } else {
      fadeOut(() => {
        audioRef.current?.pause();
        audioRef.current.volume = volume / 100;
        setIsPlaying(false);
        if (onStop) onStop(name);
      });
    }
  };

  const handleVolumeChange = (value) => {
    setVolume(value[0]);
    if (audioRef.current) {
      audioRef.current.volume = value[0] / 100;
    }
  };

  const replay = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.volume = volume / 100;
      audioRef.current.loop = true;
      audioRef.current.play().catch(error => {
        console.error('Error replaying audio:', error);
      });
      setIsPlaying(true);
      if (onPlay) onPlay(name);
    }
  };

  useEffect(() => {
    return () => {
      if (fadeInterval) {
        clearInterval(fadeInterval);
      }
    };
  }, [fadeInterval]);

  const handleCanPlay = () => {
    setCanPlay(true);
  };

  const handleError = (e) => {
    console.error(`Error loading audio ${name}:`, e);
    setCanPlay(false);
  };

  return (
    <div className={`flex items-center space-x-4 p-2 border rounded-lg transition-colors duration-300 ${
      isPlaying ? 'bg-primary/10 border-primary' : 'bg-background hover:bg-accent/50'
    }`}>
      <audio 
        ref={audioRef}
        onCanPlay={handleCanPlay}
        onError={handleError}
        onEnded={handleEnded}
      >
        {getAudioSources(url).map((source, index) => (
          <source key={index} src={source.src} type={source.type} />
        ))}
        Tu navegador no soporta el elemento de audio.
      </audio>
      <Button 
        onClick={togglePlay} 
        variant={isPlaying ? "default" : "outline"} 
        size="icon"
        disabled={!canPlay}
      >
        {isPlaying ? <Pause size={20} /> : <Play size={20} />}
      </Button>
      {!isLooping && (
        <Button 
          onClick={replay} 
          variant="outline" 
          size="icon"
          disabled={!canPlay}
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
          disabled={!canPlay}
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
              {!canPlay && (
                <p className="text-sm text-destructive">Error cargando el audio</p>
              )}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
};

const AudioSection = ({ title, audioFiles, activeTracks, onPlay, onStop, stopAll }) => (
  <div>
    <h3 className="text-lg font-semibold mb-2">{title}</h3>
    <div className="space-y-2">
      {audioFiles.map((audio) => (
        <AudioPlayer
          key={audio.name}
          name={audio.name}
          url={audio.url}
          isLooping={audio.isLooping}
          license={audio.license}
          onPlay={onPlay}
          onStop={onStop}
          stopAll={stopAll}
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

import { musicAudioFiles, ambientAudioFiles, effectsAudioFiles, sfxAudioFiles } from '@/lib/audioFiles';

const RPGSoundboard = () => {
  const [activeTracks, setActiveTracks] = useState(new Set());
  const [stopAll, setStopAll] = useState(false);

  const handlePlay = (trackName) => {
    setActiveTracks(prev => new Set(prev).add(trackName));
  };

  const handleStop = (trackName) => {
    setActiveTracks(prev => {
      const newSet = new Set(prev);
      newSet.delete(trackName);
      return newSet;
    });
  };

  const stopAllTracks = () => {
    setStopAll(true);
    setTimeout(() => setStopAll(false), 100);
  };

  return (
    <Card className="w-full min-h-screen">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="space-x-2">
            <FontAwesomeIcon icon={faDAndD} className="text-2xl" />
            <span className='text-2xl'>D&D Soundboard</span>
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
              activeTracks={activeTracks}
              onPlay={handlePlay}
              onStop={handleStop}
              stopAll={stopAll}
            />
          </div>
          {/* Columna central: Efectos de sonido */}
          <div className="lg:w-1/3 space-y-3">
            <AccordionSection title="Naturaleza">
              <AudioSection
                audioFiles={effectsAudioFiles.nature}
                activeTracks={activeTracks}
                onPlay={handlePlay}
                onStop={handleStop}
                stopAll={stopAll}
              />
            </AccordionSection>
            <AccordionSection title="Animales">
              <AudioSection
                audioFiles={effectsAudioFiles.animales}
                activeTracks={activeTracks}
                onPlay={handlePlay}
                onStop={handleStop}
                stopAll={stopAll}
              />
            </AccordionSection>
            <AccordionSection title="Naturaleza">
              <AudioSection
                audioFiles={effectsAudioFiles.nature}
                activeTracks={activeTracks}
                onPlay={handlePlay}
                onStop={handleStop}
                stopAll={stopAll}
              />
            </AccordionSection>
            <AccordionSection title="Acciones y objetos">
              <AudioSection
                audioFiles={effectsAudioFiles.acciones}
                activeTracks={activeTracks}
                onPlay={handlePlay}
                onStop={handleStop}
                stopAll={stopAll}
              />
            </AccordionSection>
            <AccordionSection title="Dragones">
              <AudioSection
                audioFiles={effectsAudioFiles.dragones}
                activeTracks={activeTracks}
                onPlay={handlePlay}
                onStop={handleStop}
                stopAll={stopAll}
              />
            </AccordionSection>
            <AccordionSection title="Combate y batallas">
              <AudioSection
                audioFiles={effectsAudioFiles.batallas}
                activeTracks={activeTracks}
                onPlay={handlePlay}
                onStop={handleStop}
                stopAll={stopAll}
              />
            </AccordionSection>
            <AccordionSection title="Personas y reacciones">
              <AudioSection
                audioFiles={effectsAudioFiles.personas}
                activeTracks={activeTracks}
                onPlay={handlePlay}
                onStop={handleStop}
                stopAll={stopAll}
              />
            </AccordionSection>
            <AccordionSection title="Monstruos">
              <AudioSection
                audioFiles={effectsAudioFiles.monstruos}
                activeTracks={activeTracks}
                onPlay={handlePlay}
                onStop={handleStop}
                stopAll={stopAll}
              />
            </AccordionSection>
          </div>      
          {/* Columna derecha: Musica */}
          <div className="lg:w-1/3 space-y-3">
            <AccordionSection title="Música para Eventos y Situaciones">
              <AudioSection
                audioFiles={musicAudioFiles.events}
                activeTracks={activeTracks}
                onPlay={handlePlay}
                onStop={handleStop}
                stopAll={stopAll}
              />
            </AccordionSection>
            <AccordionSection title="Música para Combates">
              <AudioSection
                audioFiles={musicAudioFiles.combat}
                activeTracks={activeTracks}
                onPlay={handlePlay}
                onStop={handleStop}
                stopAll={stopAll}
              />
            </AccordionSection>
            <AccordionSection title="Música para Lugares Notables">
              <AudioSection
                audioFiles={musicAudioFiles.places}
                activeTracks={activeTracks}
                onPlay={handlePlay}
                onStop={handleStop}
                stopAll={stopAll}
              />
            </AccordionSection>
            <AccordionSection title="Música para Mazmorras">
              <AudioSection
                audioFiles={musicAudioFiles.dungeons}
                activeTracks={activeTracks}
                onPlay={handlePlay}
                onStop={handleStop}
                stopAll={stopAll}
              />
            </AccordionSection>
            <AccordionSection title="Música para Tavernas">
              <AudioSection
                audioFiles={musicAudioFiles.tavern}
                activeTracks={activeTracks}
                onPlay={handlePlay}
                onStop={handleStop}
                stopAll={stopAll}
              />
            </AccordionSection>
            <AccordionSection title="Música para Ciudades y Villas">
              <AudioSection
                audioFiles={musicAudioFiles.cities}
                activeTracks={activeTracks}
                onPlay={handlePlay}
                onStop={handleStop}
                stopAll={stopAll}
              />
            </AccordionSection>
            <AccordionSection title="Música para Planos Existenciales">
              <AudioSection
                audioFiles={musicAudioFiles.planes}
                activeTracks={activeTracks}
                onPlay={handlePlay}
                onStop={handleStop}
                stopAll={stopAll}
              />
            </AccordionSection>
          </div>
          
        </div>
      </CardContent>
      <CardFooter className="flex flex-col items-start text-sm text-muted-foreground">
        <p className="mb-2">Información:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>La mayor parte de Música y Ambientación que utilizo pertenece al canal de YouTube: <a href="https://www.youtube.com/@bardify">Bardify</a>.</li>
          <li>Los efectos de sonido los he colectando con el tiempo y de algunos no recuerdo su procedencia.</li>
          <li>D&D Soundboard es contenido de fans no oficial permitido por la Política de contenido de fans. No está aprobado ni respaldado por Wizards of the Coast.</li>
        </ul>
      </CardFooter>
    </Card>
  );
};

export default RPGSoundboard;