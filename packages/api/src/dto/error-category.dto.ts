import { z } from 'zod';

// Base schema for error category validation
export const errorCategorySchema = z.object({
  name: z.string()
    .min(1, 'Category name is required')
    .max(100, 'Category name must be at most 100 characters'),
  description: z.string()
    .max(500, 'Description must be at most 500 characters')
    .optional()
});

// Create DTO
export const createErrorCategorySchema = errorCategorySchema;
export type CreateErrorCategoryDto = z.infer<typeof createErrorCategorySchema>;

// Update DTO - all fields are optional
export const updateErrorCategorySchema = errorCategorySchema.partial();
export type UpdateErrorCategoryDto = z.infer<typeof updateErrorCategorySchema>;

// Response DTO - includes additional fields from the entity
export const errorCategoryResponseSchema = errorCategorySchema.extend({
  id: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
  // Optional list of associated error codes
  errorCodes: z.array(
    z.object({
      id: z.number(),
      code: z.string()
    })
  ).optional()
});
export type ErrorCategoryResponseDto = z.infer<typeof errorCategoryResponseSchema>; 