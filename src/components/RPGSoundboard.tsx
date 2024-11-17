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
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDAndD } from '@fortawesome/free-brands-svg-icons';
import { url } from 'inspector';

const AudioPlayer = ({ name, url, isLooping = false, license, onPlay, onStop }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(50);
  const [fadeInterval, setFadeInterval] = useState(null);
  const [canPlay, setCanPlay] = useState(false);
  const audioRef = useRef(null);

  const getAudioSources = (baseUrl) => {
    const formats = [
      { type: 'audio/ogg; codecs="opus"', ext: 'opus' },
      { type: 'audio/wav', ext: 'wav' }
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
      {
        name: "La aventura comienza",
        url: "/audio/music-bardify-adventure-begins",
        isLooping: true,
        license: "Bardify ©"
      },
      {
        name: "La aventura termina",
        url: "/audio/music-bardify-adventure-ends",
        isLooping: true,
        license: "Bardify ©"
      },
      {
        name: "Fin de la búsqueda",
        url: "/audio/music-bardify-end-quest",
        isLooping: true,
        license: "Bardify ©"
      },
    ],
    combat: [
      {
        name: "Emboscada",
        url: "audio/music-bardify-ambush",
        isLooping: true,
        license: "Bardify ©"
      }
    ],
    ambient: [
      { 
        name: "Alcantarillas", 
        url: "/audio/ambience-bardify-sewers", 
        isLooping: true,
        license: "Bardify ©"
      },
      { 
        name: "Barco", 
        url: "/audio/ambience-bardify-ship", 
        isLooping: true,
        license: "Bardify ©"
      },
      { 
        name: "Bosque", 
        url: "/audio/ambience-bardify-forest", 
        isLooping: true,
        license: "Bardify ©"
      },
      { 
        name: "Bosque (nocturno)", 
        url: "/audio/ambience-bardify-forest-night", 
        isLooping: true,
        license: "Bardify ©"
      },
      { 
        name: "Ciudad", 
        url: "/audio/ambience-bardify-city", 
        isLooping: true,
        license: "Bardify ©"
      },
      { 
        name: "Cueva", 
        url: "/audio/ambience-bardify-cave", 
        isLooping: true,
        license: "Bardify ©"
      },
      { 
        name: "Fogata", 
        url: "/audio/ambience-bardify-campfire", 
        isLooping: true,
        license: "Bardify ©"
      },
      { 
        name: "Mercado", 
        url: "/audio/ambience-bardify-marketplace", 
        isLooping: true,
        license: "Bardify ©"
      },
      { 
        name: "Pantano", 
        url: "/audio/ambience-bardify-swamp", 
        isLooping: true,
        license: "Bardify ©"
      },
      { 
        name: "Playa", 
        url: "/audio/ambience-bardify-beach", 
        isLooping: true,
        license: "Bardify ©"
      },
      { 
        name: "Taverna", 
        url: "/audio/ambience-bardify-tavern", 
        isLooping: true,
        license: "Bardify ©"
      },
      { 
        name: "Tormenta eléctrica", 
        url: "/audio/ambience-bardify-thunderstorm", 
        isLooping: true,
        license: "Bardify ©"
      },
      { 
        name: "Ventisca", 
        url: "/audio/ambience-bardify-blizzard", 
        isLooping: true,
        license: "Bardify ©"
      },
      { 
        name: "Villa", 
        url: "/audio/ambience-bardify-village", 
        isLooping: true,
        license: "Bardify ©"
      },
      { 
        name: "Volcán", 
        url: "/audio/ambience-bardify-volcano", 
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
        <CardTitle className="space-x-2">
          <FontAwesomeIcon icon={faDAndD} className="text-2xl" />
          <span className='text-2xl'>D&D Soundboard</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Columna izquierda: Música */}
          <div className="lg:w-1/3 space-y-6">
            <AccordionSection title="Música para Eventos y Situaciones">
              <AudioSection
                audioFiles={audioFiles.music}
                activeTracks={activeTracks}
                onPlay={handlePlay}
                onStop={handleStop}
              />
            </AccordionSection>
            <AccordionSection title="Música para Combates">
              <AudioSection
                audioFiles={audioFiles.combat}
                activeTracks={activeTracks}
                onPlay={handlePlay}
                onStop={handleStop}
              />
            </AccordionSection>
          </div>
          {/* Columna central: Ambientación */}
          <div className="lg:w-1/3">
            <AudioSection
              title="Ambiente"
              audioFiles={audioFiles.ambient}
              activeTracks={activeTracks}
              onPlay={handlePlay}
              onStop={handleStop}
            />
          </div>
          {/* Columna derecha: Efectos de Sonido */}
          <div className="lg:w-1/3">
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