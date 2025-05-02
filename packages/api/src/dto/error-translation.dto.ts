import { z } from 'zod';

// Base schema for error translation validation
export const errorTranslationSchema = z.object({
  language: z.string()
    .min(2, 'Language code must be at least 2 characters')
    .max(10, 'Language code must be at most 10 characters'),
  message: z.string()
    .min(1, 'Message is required')
    .max(500, 'Message must be at most 500 characters'),
  errorCode: z.string()
    .min(3, 'Error code must be at least 3 characters')
    .max(50, 'Error code must be at most 50 characters')
});

// Create DTO
export const createErrorTranslationSchema = errorTranslationSchema;
export type CreateErrorTranslationDto = z.infer<typeof createErrorTranslationSchema>;

// Update DTO - message is the only field that should be updatable
export const updateErrorTranslationSchema = z.object({
  message: z.string()
    .min(1, 'Message is required')
    .max(500, 'Message must be at most 500 characters')
});
export type UpdateErrorTranslationDto = z.infer<typeof updateErrorTranslationSchema>;

// Response DTO - includes additional fields from the entity
export const errorTranslationResponseSchema = errorTranslationSchema.extend({
  id: z.number(),
  updatedAt: z.date()
});
export type ErrorTranslationResponseDto = z.infer<typeof errorTranslationResponseSchema>; 