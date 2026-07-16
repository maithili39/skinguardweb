import { z } from "zod";
import { SKIN_TYPES, CONCERNS } from "./profile";

const skinTypeIds = SKIN_TYPES.map((t) => t.id) as [string, ...string[]];
const concernIds = CONCERNS.map((c) => c.id) as [string, ...string[]];

export const profileSchema = z.object({
  skinType: z.enum(skinTypeIds).default("normal"),
  concerns: z.array(z.enum(concernIds)).max(10).default([]),
});

export const analyzeSchema = z.object({
  text: z.string().min(1, "Paste an ingredient list to analyze.").max(20000),
  // Omitted profile falls back to the field defaults (normal skin, no concerns)
  profile: profileSchema.prefault({}),
  label: z.string().max(120).optional(),
});

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("Enter a valid email address.")
  .max(254);

export const credentialsSchema = z.object({
  email: emailSchema,
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .max(200, "Password is too long."),
});

export const savedItemSchema = z.object({
  itemType: z.enum(["product", "ingredient"]),
  itemId: z.number().int().positive(),
});
