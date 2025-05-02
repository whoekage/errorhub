import { z } from 'zod';
import { errorTranslationBaseSchema } from './base.dto';

/**
 * Schema for creating a new error translation (request)
 */
export const createErrorTranslationRequest = errorTranslationBaseSchema.extend({
  errorCode: z.string()
    .min(3, 'Error code must be at least 3 characters')
    .max(50, 'Error code must be at most 50 characters')
    .regex(/^[A-Z0-9_]+(\.[A-Z0-9_]+)+$/, 'Error code must follow the format DOMAIN.ERROR_NAME'),
});

/**
 * Schema for error translation response after creation
 */
export const createErrorTranslationResponse = errorTranslationBaseSchema.extend({
  id: z.number().int().positive(),
  errorCode: z.string()
    .min(3, 'Error code must be at least 3 characters')
    .max(50, 'Error code must be at most 50 characters'),
  createdAt: z.string().or(z.date()),
  updatedAt: z.string().or(z.date()),
});

// Backward compatibility
export const createErrorTranslationSchema = createErrorTranslationRequest;
export const createErrorTranslationRequestSchema = createErrorTranslationRequest;
export const createErrorTranslationResponseSchema = createErrorTranslationResponse; 