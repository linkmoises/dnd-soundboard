Esta es un aplicación creada con [Next.js](https://nextjs.org) solo por diversión para cuando juego D&D con mis hijos. Es un tablero de sonidos para la ambientación de la partida.

## Empezando

Solo hay que lanzar el servidor de desarrollo: 

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Abrir [http://localhost:3000](http://localhost:3000) con el navegador, y tendremos nuestro tablero corriendo.

Para editar la lista de audios, los cambios se hacen en `src/components/RPGSoundboard.tsx`. La página se actualiza sola.

## Añadiendo Audios

Para evitar algún tema legal, este proyecto se distribuye sin archivos de audio. Los archivos de audio se añaden en el directorio: `public/audio`. Yo los mantengo con una estructura de prefijos antes del título: `ambience-autor-titulo`, `music-autor-titulo`, `sfx-autor-titulo`.

Admite archivos de audio en formato `opus`, `mp3` y `wav`.

La lista de audios que se muestran se edita en 

```TSX
    music: [
      { 
        name: "Música de ejemplo", 
        url: "/audio/music-example", 
        isLooping: true,
        license: "CC0 - Dominio Público"
      },
    ],
    ambient: [
      { 
        name: "Ambientación de ejemplo", 
        url: "/audio/ambience-example", 
        isLooping: true,
        license: "CC0 - Dominio Público"
      },
    ],
    effects: [
      { 
        name: "Sonido de ejemplo", 
        url: "/audio/sfx-example", 
        isLooping: false,
        license: "CC0 - Dominio Público"
      },
    ]
```

## Créditos

Los créditos de los audios son de sus respectivos autores. D&D Soundboard es contenido de fans no oficial permitido por la Política de contenido de fans. No está aprobado ni respaldado por Wizards of the Coast.