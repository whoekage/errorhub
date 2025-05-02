import { z } from 'zod';
import { errorCategoryBaseSchema } from './base.dto';

/**
 * Schema for creating a new error category (request)
 */
export const createErrorCategoryRequest = errorCategoryBaseSchema;

/**
 * Schema for error category response after creation
 */
export const createErrorCategoryResponse = errorCategoryBaseSchema.extend({
  id: z.number().int().positive(),
  createdAt: z.string().or(z.date()),
  updatedAt: z.string().or(z.date()),
});

// Backward compatibility
export const createErrorCategorySchema = createErrorCategoryRequest;
export const createErrorCategoryRequestSchema = createErrorCategoryRequest;
export const createErrorCategoryResponseSchema = createErrorCategoryResponse; 