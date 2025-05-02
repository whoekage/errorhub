import { z } from 'zod';
import { errorCodeBaseSchema } from './base.dto';

/**
 * Base response schema for a category
 */
const categoryResponseSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1),
});

/**
 * Base response schema for a translation
 */
const translationResponseSchema = z.object({
  id: z.number().int().positive(),
  language: z.string().min(2).max(10),
  message: z.string().min(1),
});

/**
 * Schema for error code responses
 * Includes additional fields from the entity
 */
export const errorCodeResponseSchema = errorCodeBaseSchema.extend({
  id: z.number().int().positive(),
  categoryId: z.number().int().positive(),
  createdAt: z.string().or(z.date()),
  updatedAt: z.string().or(z.date()),
  // Optional related entities
  category: categoryResponseSchema.optional(),
  translations: z.array(translationResponseSchema).optional(),
});

export type ErrorCodeResponseDto = z.infer<typeof errorCodeResponseSchema>;

/**
 * Schema for a list of error codes
 */
export const errorCodeListResponseSchema = z.array(errorCodeResponseSchema);
export type ErrorCodeListResponseDto = z.infer<typeof errorCodeListResponseSchema>; 