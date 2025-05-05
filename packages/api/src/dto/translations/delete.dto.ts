import { z } from 'zod';

export const deleteTranslationRequest = z.object({
  id: z.number().int().positive(),
});

export const deleteTranslationResponse = z.object({
  success: z.boolean(),
});

export type DeleteTranslationRequest = z.infer<typeof deleteTranslationRequest>;
export type DeleteTranslationResponse = z.infer<typeof deleteTranslationResponse>;

