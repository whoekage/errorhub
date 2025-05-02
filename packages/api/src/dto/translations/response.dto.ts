import { z } from 'zod';
import { errorTranslationBaseSchema } from './base.dto';

/**
 * Schema for error translation responses
 * Includes additional fields from the entity
 */
export const errorTranslationResponseSchema = errorTranslationBaseSchema.extend({
  id: z.number().int().positive(),
  errorCode: z.string()
    .min(3, 'Error code must be at least 3 characters')
    .max(50, 'Error code must be at most 50 characters'),
  createdAt: z.string().or(z.date()),
  updatedAt: z.string().or(z.date()),
});

export type ErrorTranslationResponseDto = z.infer<typeof errorTranslationResponseSchema>;

/**
 * Schema for a list of error translations
 */
export const errorTranslationListResponseSchema = z.array(errorTranslationResponseSchema);
export type ErrorTranslationListResponseDto = z.infer<typeof errorTranslationListResponseSchema>; 