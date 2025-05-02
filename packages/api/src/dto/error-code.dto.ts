import { z } from 'zod';

// Base schema for error code validation
export const errorCodeSchema = z.object({
  code: z.string()
    .min(3, 'Error code must be at least 3 characters')
    .max(50, 'Error code must be at most 50 characters')
    .regex(/^[A-Z0-9_]+(\.[A-Z0-9_]+)+$/, 'Error code must follow the format DOMAIN.ERROR_NAME'),
  categoryId: z.number().int().positive('Category ID must be a positive integer'),
  defaultMessage: z.string()
    .min(1, 'Default message is required')
    .max(500, 'Default message must be at most 500 characters'),
});

// Create DTO
export const createErrorCodeSchema = errorCodeSchema;
export type CreateErrorCodeDto = z.infer<typeof createErrorCodeSchema>;

// Update DTO - all fields are optional
export const updateErrorCodeSchema = errorCodeSchema.partial();
export type UpdateErrorCodeDto = z.infer<typeof updateErrorCodeSchema>;

// Response DTO - includes additional fields from the entity
export const errorCodeResponseSchema = errorCodeSchema.extend({
  id: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
  // Optional nested fields
  category: z.object({
    id: z.number(),
    name: z.string()
  }).optional(),
  translations: z.array(
    z.object({
      id: z.number(),
      language: z.string(),
      message: z.string()
    })
  ).optional()
});
export type ErrorCodeResponseDto = z.infer<typeof errorCodeResponseSchema>;

// DTO for batch fetching error codes
export const batchFetchSchema = z.object({
  codes: z.array(z.string()),
  language: z.string().optional()
});
export type BatchFetchDto = z.infer<typeof batchFetchSchema>; 