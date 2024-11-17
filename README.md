Suelo jugar Calabozos y Dragones con mis hijos, la ambientación auditiva la suelo hacer con Spotify y con YouTube, pero desde hace un tiempo los anuncios han hecho que deje de utilizar mi canal favorito, [Bardify](https://www.youtube.com/@bardify). Por este motivo he terminado construyendo una aplicación con [React](https://react.dev/) y [Next.js](https://nextjs.org) solo por diversión, un tablero de sonidos para la ambientación de partidas de rol.

## Empezando

Solo hay que lanzar el servidor: 

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

## Añadiendo Audios

Para evitar algún tema legal, este proyecto se distribuye sin archivos de audio. Los archivos de audio se añaden en el directorio: `public/audio`. Yo los mantengo con una estructura de prefijos antes del título: `ambience-autor-titulo`, `music-autor-titulo`, `sfx-autor-titulo`.

La aplicación admite archivos de audio en formato `opus`, `mp3` y `wav`.

La lista de audios que se muestran se edita en `src/components/RPGSoundboard.tsx`. La página se actualiza sola.

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

## Funcionamiento

El funcionamiento es simple. Solo hay que tocar el botón de _play_, el sonido fluirá. Pueden sonar varias pistas de audio a la vez, las cuales son resaltadas visualmente, cada una tiene su control de volumen individual. Los sonidos de efectos se pueden configurar para reproducirse en _loop_ o una sola vez.

## Créditos

Los créditos de los audios son de sus respectivos autores. D&D Soundboard es contenido de fans no oficial permitido por la Política de contenido de fans. No está aprobado ni respaldado por Wizards of the Coast.