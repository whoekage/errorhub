import { z } from 'zod';
import { errorCategoryBaseSchema } from './base.dto';

/**
 * Schema for error category responses
 * Includes additional fields from the entity
 */
export const errorCategoryResponseSchema = errorCategoryBaseSchema.extend({
  id: z.number().int().positive(),
  createdAt: z.string().or(z.date()),
  updatedAt: z.string().or(z.date()),
});

export type ErrorCategoryResponseDto = z.infer<typeof errorCategoryResponseSchema>;

/**
 * Schema for a list of error categories
 */
export const errorCategoryListResponseSchema = z.array(errorCategoryResponseSchema);
export type ErrorCategoryListResponseDto = z.infer<typeof errorCategoryListResponseSchema>; 