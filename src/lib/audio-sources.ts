export type AudioSource = {
  src: string;
  type: string;
};

export const getAudioSources = (baseUrl: string): AudioSource[] => {
  const baseUrlWithoutExt = baseUrl.replace(/\.[^/.]+$/, "");

  return [
    {
      src: `${baseUrlWithoutExt}.opus`,
      type: 'audio/ogg; codecs="opus"',
    },
  ];
};
