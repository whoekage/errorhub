import { z } from 'zod';

/**
 * Error code validation schemas
 */
export const errorCodeSchema = z.object({
  code: z.string()
    .min(3, 'Error code must be at least 3 characters')
    .max(50, 'Error code must be at most 50 characters')
    .regex(/^[A-Z0-9_]+(\.[A-Z0-9_]+)+$/, 'Error code must follow the format DOMAIN.ERROR_NAME'),
  category: z.string()
    .min(1, 'Category is required')
    .max(100, 'Category must be at most 100 characters'),
  defaultMessage: z.string()
    .min(1, 'Default message is required')
    .max(500, 'Default message must be at most 500 characters'),
});

export type ErrorCodeInput = z.infer<typeof errorCodeSchema>;

export const errorCodeUpdateSchema = errorCodeSchema.partial();
export type ErrorCodeUpdateInput = z.infer<typeof errorCodeUpdateSchema>;

/**
 * Error translation validation schemas
 */
export const errorTranslationSchema = z.object({
  language: z.string()
    .min(2, 'Language code must be at least 2 characters')
    .max(10, 'Language code must be at most 10 characters'),
  message: z.string()
    .min(1, 'Message is required')
    .max(500, 'Message must be at most 500 characters'),
});

export type ErrorTranslationInput = z.infer<typeof errorTranslationSchema>;

export const errorTranslationUpdateSchema = errorTranslationSchema.partial();
export type ErrorTranslationUpdateInput = z.infer<typeof errorTranslationUpdateSchema>; 