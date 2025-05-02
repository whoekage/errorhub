import { z } from 'zod';

/**
 * Base schema for error category validation
 */
export const errorCategoryBaseSchema = z.object({
  name: z.string()
    .min(1, 'Category name is required')
    .max(100, 'Category name must be at most 100 characters'),
  description: z.string()
    .max(500, 'Description must be at most 500 characters')
    .optional(),
});

export type ErrorCategoryBase = z.infer<typeof errorCategoryBaseSchema>; 