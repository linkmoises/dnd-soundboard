export type SoundCategory = "ambient" | "music" | "sfx";

export type SoundCategoryDefinition = {
  id: SoundCategory;
  label: string;
  defaultVolume: number;
};

export const SOUND_CATEGORIES: SoundCategoryDefinition[] = [
  { id: "ambient", label: "Ambientación", defaultVolume: 80 },
  { id: "music", label: "Música", defaultVolume: 80 },
  { id: "sfx", label: "Efectos (SFX)", defaultVolume: 90 },
];

export const getDefaultCategoryVolumes = (): Record<SoundCategory, number> =>
  SOUND_CATEGORIES.reduce(
    (volumes, category) => ({ ...volumes, [category.id]: category.defaultVolume }),
    {} as Record<SoundCategory, number>
  );
