import { z } from 'zod';

/**
 * Base schema for error translation validation
 */
export const errorTranslationBaseSchema = z.object({
  language: z.string()
    .min(2, 'Language code must be at least 2 characters')
    .max(10, 'Language code must be at most 10 characters'),
  message: z.string()
    .min(1, 'Message is required')
    .max(500, 'Message must be at most 500 characters'),
});

export type ErrorTranslationBase = z.infer<typeof errorTranslationBaseSchema>;