import { z } from 'zod';
import { errorCategoryBaseSchema } from './base.dto';
import { createErrorCategoryResponse } from './create.dto';

/**
 * Schema for updating an existing error category (request)
 * All fields are optional in updates
 */
export const updateErrorCategoryRequest = errorCategoryBaseSchema.partial();

/**
 * Schema for error category response after update
 * Uses the same schema as create response
 */
export const updateErrorCategoryResponse = createErrorCategoryResponse;

// Backward compatibility
export const updateErrorCategorySchema = updateErrorCategoryRequest;
export const updateErrorCategoryRequestSchema = updateErrorCategoryRequest;
export const updateErrorCategoryResponseSchema = updateErrorCategoryResponse; 