import { z } from 'zod';
import { createErrorTranslationResponse } from './create.dto';

/**
 * Schema for updating an existing error translation (request)
 * Only message should be updatable
 */
export const updateErrorTranslationRequest = z.object({
  message: z.string()
    .min(1, 'Message is required')
    .max(500, 'Message must be at most 500 characters'),
});

/**
 * Schema for error translation response after update
 * Uses the same schema as create response
 */
export const updateErrorTranslationResponse = createErrorTranslationResponse;

// Backward compatibility
export const updateErrorTranslationSchema = updateErrorTranslationRequest;
export const updateErrorTranslationRequestSchema = updateErrorTranslationRequest;
export const updateErrorTranslationResponseSchema = updateErrorTranslationResponse; 