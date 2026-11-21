export type AudioSource = {
  src: string;
  type: string;
};

/** Cover images share the audio file name and only change the extension. */
export const CARD_IMAGE_EXTENSION = "webp";

const stripExtension = (baseUrl: string) => baseUrl.replace(/\.[^/.]+$/, "");

export const getAudioSources = (baseUrl: string): AudioSource[] => [
  {
    src: `${stripExtension(baseUrl)}.opus`,
    type: 'audio/ogg; codecs="opus"',
  },
];

export const getCardImage = (baseUrl: string) =>
  `${stripExtension(baseUrl)}.${CARD_IMAGE_EXTENSION}`;
