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
import { ThemeToggle } from "@/components/ToogleDark"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDAndD } from '@fortawesome/free-brands-svg-icons';

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
      {
        name: "Despertar de un mal ancestral",
        url: "/audio/ambience-bardify-ancient-evil-awakens",
        isLooping: true,
        license: "Bardify ©"
      },
      {
        name: "Despedida",
        url: "/audio/ambience-bardify-farewell",
        isLooping: true,
        license: "Bardify ©"
      },
      {
        name: "Noche de gala",
        url: "/audio/ambience-bardify-gala-night",
        isLooping: true,
        license: "Bardify ©"
      },
      {
        name: "El robo",
        url: "/audio/ambience-bardify-heist",
        isLooping: true,
        license: "Bardify ©"
      },
      {
        name: "Investigando misterios",
        url: "/audio/ambience-bardify-investigating-mistery",
        isLooping: true,
        license: "Bardify ©"
      },
      {
        name: "La última despedida",
        url: "/audio/ambience-bardify-last-goodbye",
        isLooping: true,
        license: "Bardify ©"
      },
      {
        name: "Encuentro mítico",
        url: "/audio/ambience-bardify-mythic-enconunter",
        isLooping: true,
        license: "Bardify ©"
      },
      {
        name: "Suspenso",
        url: "/audio/ambience-bardify-suspense",
        isLooping: true,
        license: "Bardify ©"
      },
      {
        name: "Negociaciones tensas",
        url: "/audio/ambience-bardify-tense-negotiations",
        isLooping: true,
        license: "Bardify ©"
      },
      {
        name: "Traición trágica",
        url: "/audio/ambience-bardify-tragic-betrayal",
        isLooping: true,
        license: "Bardify ©"
      },
      {
        name: "Fiesta en aldea",
        url: "/audio/ambience-bardify-village-feast",
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
      },
      {
        name: "Huida de guardias",
        url: "audio/music-bardify-running-from-guards",
        isLooping: true,
        license: "Bardify ©"
      },
      {
        name: "Jefe de Mazmorra",
        url: "audio/music-bardify-dungeon-boss",
        isLooping: true,
        license: "Bardify ©"
      },
      {
        name: "Jefe final",
        url: "audio/music-bardify-final-boss",
        isLooping: true,
        license: "Bardify ©"
      },
      {
        name: "Pelea demoníaca",
        url: "audio/music-bardify-fiend-fight",
        isLooping: true,
        license: "Bardify ©"
      },
      {
        name: "Pelea épica",
        url: "audio/music-bardify-epic-fight",
        isLooping: true,
        license: "Bardify ©"
      },
      {
        name: "Persecusión",
        url: "audio/music-bardify-chase",
        isLooping: true,
        license: "Bardify ©"
      },
      {
        name: "Sorpresa",
        url: "audio/music-bardify-surprise",
        isLooping: true,
        license: "Bardify ©"
      },
    ],
    places: [
      {
        name: "Bosque místico",
        url: "/audio/music-bardify-mystic-forest",
        isLooping: true,
        license: "Bardify ©"
      },
      {
        name: "Jardín élfico",
        url: "/audio/music-bardify-elven-garden",
        isLooping: true,
        license: "Bardify ©"
      },
      {
        name: "Santuario élfico",
        url: "/audio/music-bardify-elven-sanctuary",
        isLooping: true,
        license: "Bardify ©"
      },
      {
        name: "Tecnología perdida",
        url: "/audio/music-bardify-lost-technology",
        isLooping: true,
        license: "Bardify ©"
      },
      { 
        name: "Templo", 
        url: "/audio/music-bardify-city-temple", 
        isLooping: true,
        license: "Bardify ©"
      },
      {
        name: "Tienda de ítems mágicos",
        url: "/audio/music-bardify-magic-item-shop",
        isLooping: true,
        license: "Bardify ©"
      },
      {
        name: "Torre de mago",
        url: "/audio/music-bardify-wizard-tower",
        isLooping: true,
        license: "Bardify ©"
      },
    ],
    dungeons: [
      {
        name: "Cabaña de bruja",
        url: "/audio/music-bardify-hag-hut",
        isLooping: true,
        license: "Bardify ©"
      },
      {
        name: "Castillo de vampiro",
        url: "/audio/music-bardify-vampire-castle",
        isLooping: true,
        license: "Bardify ©"
      },
      {
        name: "Castillo oscuro",
        url: "/audio/music-bardify-dark-castle",
        isLooping: true,
        license: "Bardify ©"
      },
      {
        name: "Catacumbas",
        url: "/audio/music-bardify-catacomb",
        isLooping: true,
        license: "Bardify ©"
      },
      {
        name: "Cementerio",
        url: "/audio/music-bardify-cemetery",
        isLooping: true,
        license: "Bardify ©"
      },
      {
        name: "Cripta maldita",
        url: "/audio/music-bardify-haunted-crypt",
        isLooping: true,
        license: "Bardify ©"
      },
      {
        name: "Cueva espeluznante",
        url: "/audio/music-bardify-spooky-cave",
        isLooping: true,
        license: "Bardify ©"
      },
      {
        name: "Guarida de monstruo",
        url: "/audio/music-bardify-monster-lair",
        isLooping: true,
        license: "Bardify ©"
      },
      {
        name: "Mansión maldita",
        url: "/audio/music-bardify-haunted-mansion",
        isLooping: true,
        license: "Bardify ©"
      },
      {
        name: "Mazmorra espeluznante",
        url: "/audio/music-bardify-creepy-dungeon",
        isLooping: true,
        license: "Bardify ©"
      },
      { 
        name: "Ruinas abandonadas", 
        url: "/audio/music-bardify-abandoned-ruins", 
        isLooping: true,
        license: "Bardify ©"
      },
      {
        name: "Ruinas de templo perdido",
        url: "/audio/music-bardify-lost-temple-ruins",
        isLooping: true,
        license: "Bardify ©"
      },
      {
        name: "Ruinas en el desierto",
        url: "/audio/music-bardify-desert-ruins",
        isLooping: true,
        license: "Bardify ©"
      },
      {
        name: "Tumba ancestral",
        url: "/audio/music-bardify-ancient-tomb",
        isLooping: true,
        license: "Bardify ©"
      },
      {
        name: "Underdark",
        url: "/audio/music-bardify-underdark",
        isLooping: true,
        license: "Bardify ©"
      },
      
    ],
    tavern: [
      {
        name: "Banda de un bardo",
        url: "/audio/music-bardify-one-band-bard",
        isLooping: true,
        license: "Bardify ©"
      },
      {
        name: "Banda vagabunda",
        url: "/audio/music-bardify-wandering-band",
        isLooping: true,
        license: "Bardify ©"
      },
      { 
        name: "Cerveza y anécdotas", 
        url: "/audio/music-bardify-ale-anecdotes", 
        isLooping: true,
        license: "Bardify ©"
      },
      {
        name: "Concierto en taverna",
        url: "/audio/music-bardify-tavern-concert",
        isLooping: true,
        license: "Bardify ©"
      },
      {
        name: "Cuento de un bardo",
        url: "/audio/music-bardify-bard-tale",
        isLooping: true,
        license: "Bardify ©"
      },
      {
        name: "Danza en taverna",
        url: "/audio/music-bardify-tavern-dance",
        isLooping: true,
        license: "Bardify ©"
      },
      {
        name: "Descanso de viajeros",
        url: "/audio/music-bardify-travellers-rest",
        isLooping: true,
        license: "Bardify ©"
      },
      {
        name: "Posada Stonehill",
        url: "/audio/music-bardify-stonehill-inn",
        isLooping: true,
        license: "Bardify ©"
      },
      {
        name: "Taverna acogedora",
        url: "/audio/music-bardify-cozy-tavern",
        isLooping: true,
        license: "Bardify ©"
      },
      {
        name: "Taverna élfica",
        url: "/audio/music-bardify-elven-tavern",
        isLooping: true,
        license: "Bardify ©"
      },
      {
        name: "Taverna en desierto",
        url: "/audio/music-bardify-tavern-desert",
        isLooping: true,
        license: "Bardify ©"
      },
      {
        name: "Taverna grandes cuentos",
        url: "/audio/music-bardify-tall-tales-tavern",
        isLooping: true,
        license: "Bardify ©"
      },
      {
        name: "Taverna pirata",
        url: "/audio/music-bardify-pirate-tavern",
        isLooping: true,
        license: "Bardify ©"
      },
      {
        name: "Taverna sombría",
        url: "/audio/music-bardify-shady-tavern",
        isLooping: true,
        license: "Bardify ©"
      },
    ],
    cities: [
      {
        name: "Aldea en la jungla",
        url: "/audio/music-bardify-jungle-village",
        isLooping: true,
        license: "Bardify ©"
      },
      {
        name: "Aldea goblin",
        url: "/audio/music-bardify-goblin-village",
        isLooping: true,
        license: "Bardify ©"
      },
      {
        name: "Aldea isleña",
        url: "/audio/music-bardify-island-village",
        isLooping: true,
        license: "Bardify ©"
      },
      {
        name: "Aldea oriental",
        url: "/audio/music-bardify-eastern-village",
        isLooping: true,
        license: "Bardify ©"
      },
      {
        name: "Aldea pacífica",
        url: "/audio/music-bardify-peaceful-village",
        isLooping: true,
        license: "Bardify ©"
      },
      {
        name: "Callejón sombrío",
        url: "/audio/music-bardify-shady-alley",
        isLooping: true,
        license: "Bardify ©"
      },
      {
        name: "Ciudad bajo el agua",
        url: "/audio/music-bardify-underwater-city",
        isLooping: true,
        license: "Bardify ©"
      },
      {
        name: "Ciudad de ladrones",
        url: "/audio/music-bardify-city-thieves",
        isLooping: true,
        license: "Bardify ©"
      },
      {
        name: "Ciudad de tristeza",
        url: "/audio/music-bardify-city-sorrow",
        isLooping: true,
        license: "Bardify ©"
      },
      {
        name: "Ciudad élfica",
        url: "/audio/music-bardify-elven-city",
        isLooping: true,
        license: "Bardify ©"
      },
      {
        name: "Ciudad enana",
        url: "/audio/music-bardify-dwarven-city",
        isLooping: true,
        license: "Bardify ©"
      },
      {
        name: "Ciudad grande",
        url: "/audio/music-bardify-large-city",
        isLooping: true,
        license: "Bardify ©"
      },
      {
        name: "Ciudad nórdica",
        url: "/audio/music-bardify-nordic-city",
        isLooping: true,
        license: "Bardify ©"
      },
      {
        name: "Ciudad orca",
        url: "/audio/music-bardify-orc-city",
        isLooping: true,
        license: "Bardify ©"
      },
      {
        name: "Ciudad pequeña",
        url: "/audio/music-bardify-small-city",
        isLooping: true,
        license: "Bardify ©"
      },
      {
        name: "Ciudad perdida",
        url: "/audio/music-bardify-lost-city",
        isLooping: true,
        license: "Bardify ©"
      },
      {
        name: "Noches árabes",
        url: "/audio/music-bardify-arabian-nights",
        isLooping: true,
        license: "Bardify ©"
      },
      {
        name: "Pueblo abandonado",
        url: "/audio/music-bardify-forsaken-town",
        isLooping: true,
        license: "Bardify ©"
      },
      {
        name: "Pueblo costero",
        url: "/audio/music-bardify-seaside-town",
        isLooping: true,
        license: "Bardify ©"
      },
      {
        name: "Pueblo pacífico",
        url: "/audio/music-bardify-peaceful-town",
        isLooping: true,
        license: "Bardify ©"
      },
    ],
    planes: [
      {
        name: "Feywild",
        url: "/audio/music-bardify-feywild",
        isLooping: true,
        license: "Bardify ©"
      },
      {
        name: "Horror cósmico",
        url: "/audio/music-bardify-cosmic-horror",
        isLooping: true,
        license: "Bardify ©"
      },
      {
        name: "Monte Celestia",
        url: "/audio/music-bardify-mount-celestia",
        isLooping: true,
        license: "Bardify ©"
      },
      {
        name: "Océano Astral",
        url: "/audio/music-bardify-sailing-astral-sea",
        isLooping: true,
        license: "Bardify ©"
      },
      {
        name: "Pasaje abisal",
        url: "/audio/music-bardify-abyssal-passage",
        isLooping: true,
        license: "Bardify ©"
      },
      { 
        name: "Plano etéreo", 
        url: "/audio/music-bardify-ethereal-plane", 
        isLooping: true,
        license: "Bardify ©"
      },
      {
        name: "Reino lejano",
        url: "/audio/music-bardify-far-realm",
        isLooping: true,
        license: "Bardify ©"
      },
      {
        name: "Shadowfell",
        url: "/audio/music-bardify-shadowfell",
        isLooping: true,
        license: "Bardify ©"
      },
    ],
    ambient: [
      { 
        name: "Alcantarillas", 
        url: "/audio/ambience-bardify-sewers", 
        isLooping: true,
        license: "Bardify ©"
      },
      { 
        name: "Aldea", 
        url: "/audio/ambience-bardify-village", 
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
        name: "Pelea en taverna", 
        url: "/audio/ambience-sword-coast-soundscapes-bar-room-brawl", 
        isLooping: true,
        license: "Sword Coast Soundscapes ©"
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
        name: "Taverna concurrida", 
        url: "/audio/ambience-sword-coast-soundscapes-crowded-local-tavern", 
        isLooping: true,
        license: "Sword Coast Soundscapes ©"
      },
      { 
        name: "Taverna Portal Bostezante", 
        url: "/audio/ambience-sword-coast-soundscapes-yawning-portal", 
        isLooping: true,
        license: "Sword Coast Soundscapes ©"
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
        <div className="flex justify-between items-center">
          <CardTitle className="space-x-2">
            <FontAwesomeIcon icon={faDAndD} className="text-2xl" />
            <span className='text-2xl'>D&D Soundboard</span>
          </CardTitle>
          <ThemeToggle />
        </div>
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
            <AccordionSection title="Música para Lugares Notables">
              <AudioSection
                audioFiles={audioFiles.places}
                activeTracks={activeTracks}
                onPlay={handlePlay}
                onStop={handleStop}
              />
            </AccordionSection>
            <AccordionSection title="Música para Mazmorras">
              <AudioSection
                audioFiles={audioFiles.dungeons}
                activeTracks={activeTracks}
                onPlay={handlePlay}
                onStop={handleStop}
              />
            </AccordionSection>
            <AccordionSection title="Música para Tavernas">
              <AudioSection
                audioFiles={audioFiles.tavern}
                activeTracks={activeTracks}
                onPlay={handlePlay}
                onStop={handleStop}
              />
            </AccordionSection>
            <AccordionSection title="Música para Ciudades y Villas">
              <AudioSection
                audioFiles={audioFiles.cities}
                activeTracks={activeTracks}
                onPlay={handlePlay}
                onStop={handleStop}
              />
            </AccordionSection>
            <AccordionSection title="Música para Planos Existenciales">
              <AudioSection
                audioFiles={audioFiles.planes}
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