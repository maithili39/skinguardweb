export const SKIN_TYPES = [
  { id: "normal", label: "Normal Skin" },
  { id: "dry", label: "Dry Skin" },
  { id: "oily", label: "Oily Skin" },
  { id: "combination", label: "Combination" },
] as const;

export type SkinType = (typeof SKIN_TYPES)[number]["id"];

export const CONCERNS = [
  { id: "none", label: "No Concerns" },
  { id: "acne", label: "Acne Prone" },
  { id: "sensitive", label: "Sensitive Skin" },
  { id: "pregnancy", label: "Pregnant / Nursing" },
  { id: "fungal-acne", label: "Fungal Acne" },
  { id: "rosacea", label: "Rosacea" },
] as const;

export type Concern = (typeof CONCERNS)[number]["id"];

export interface SkinProfile {
  skinType: SkinType;
  concerns: Concern[];
}

export const DEFAULT_PROFILE: SkinProfile = {
  skinType: "normal",
  concerns: [],
};
