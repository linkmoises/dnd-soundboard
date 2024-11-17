"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Volume2, Volume1, VolumeX, Play, Pause, RotateCcw, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const AudioPlayer = ({ name, url, isLooping = false, license, onPlay, onStop }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(50);
  const [fadeInterval, setFadeInterval] = useState(null);
  const [canPlay, setCanPlay] = useState(false);
  const audioRef = useRef(null);

  // Función para obtener las URLs de diferentes formatos
  const getAudioSources = (baseUrl) => {
    const formats = [
      { type: 'audio/mpeg', ext: 'mp3' },
      { type: 'audio/ogg; codecs="opus"', ext: 'opus' },
      { type: 'audio/wav', ext: 'wav' }
    ];
    
    // Remove the extension from the base URL if it exists
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
          <RotateCcw size={20} />
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

const AudioSection = ({ title, audioFiles, activeTracks, onPlay, onStop }) => (
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
        />
      ))}
    </div>
  </div>
);

const RPGSoundboard = () => {
  const [activeTracks, setActiveTracks] = useState(new Set());

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

  const audioFiles = {
    music: [
      { 
        name: "Sesión Zero", 
        url: "/audio/music-bardify-session-zero", 
        isLooping: true,
        license: "Bardify ©"
      },
    ],
    ambient: [
      { 
        name: "Bosque", 
        url: "/audio/ambience-bardify-forest", 
        isLooping: true,
        license: "Bardify ©"
      },
      { 
        name: "Tormenta eléctrica", 
        url: "/audio/ambience-bardify-thunderstorm", 
        isLooping: true,
        license: "Bardify ©"
      },
    ],
    effects: [
      { 
        name: "Puerta", 
        url: "/audio/door", 
        isLooping: false,
        license: "CC0 - Dominio Público"
      },
    ]
  };

  return (
    <Card className="w-full min-h-screen">
      <CardHeader>
        <CardTitle>D&D Soundboard</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Columna izquierda: Música y Ambiente */}
          <div className="lg:w-1/2 space-y-6">
            <AudioSection
              title="Música"
              audioFiles={audioFiles.music}
              activeTracks={activeTracks}
              onPlay={handlePlay}
              onStop={handleStop}
            />
            <AudioSection
              title="Ambiente"
              audioFiles={audioFiles.ambient}
              activeTracks={activeTracks}
              onPlay={handlePlay}
              onStop={handleStop}
            />
          </div>
          
          {/* Columna derecha: Efectos de Sonido */}
          <div className="lg:w-1/2">
            <AudioSection
              title="Efectos de Sonido"
              audioFiles={audioFiles.effects}
              activeTracks={activeTracks}
              onPlay={handlePlay}
              onStop={handleStop}
            />
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col items-start text-sm text-muted-foreground">
        <p className="mb-2">Información sobre licencias:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>CC0 - Contenido de dominio público, uso libre sin atribución</li>
          <li>CC-BY 4.0 - Uso libre con atribución requerida</li>
          <li>CC-BY-SA 4.0 - Uso libre con atribución y compartir bajo la misma licencia</li>
          <li>© Todos los derechos reservados - Contenido original, uso no permitido sin autorización</li>
        </ul>
      </CardFooter>
    </Card>
  );
};

export default RPGSoundboard;