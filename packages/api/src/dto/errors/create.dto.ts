import { z } from 'zod';
import { errorCodeBaseSchema } from './base.dto';

/**
 * Schema for creating a new error code (request)
 */


/**
 * Base response schema for a category
 */
const categoryResponse = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1),
});

/**
 * Base response schema for a translation
 */
const translationResponse = z.object({
  id: z.number().int().positive(),
  language: z.string().min(2).max(10),
  message: z.string().min(1),
});

/**
 * Schema for error code response after creation
 */
export const createErrorCodeResponse = errorCodeBaseSchema.extend({
  id: z.number().int().positive(),
  categoryId: z.number().int().positive().nullable(),
  createdAt: z.string().or(z.date()),
  updatedAt: z.string().or(z.date()),
  // Optional related entities
  category: categoryResponse.optional(),
  translations: z.array(translationResponse).optional(),
});


export const createErrorCodeRequest = errorCodeBaseSchema
export const createErrorCodeRequestSchema = createErrorCodeRequest;
export const createErrorCodeResponseSchema = createErrorCodeResponse; 