import { z } from 'zod';
import { errorCodeBaseSchema } from './base.dto';
import { createErrorCodeResponse } from './create.dto';

/**
 * Schema for updating an existing error code (request)
 * All fields are optional in updates
 */
export const updateErrorCodeRequest = errorCodeBaseSchema
  .extend({
    categoryId: z.number()
      .int('Category ID must be an integer')
      .positive('Category ID must be a positive integer'),
  })
  .partial();

/**
 * Schema for error code response after update
 * Uses the same schema as create response
 */
export const updateErrorCodeResponse = createErrorCodeResponse;

// Backward compatibility
export const updateErrorCodeSchema = updateErrorCodeRequest;
export const updateErrorCodeRequestSchema = updateErrorCodeRequest;
export const updateErrorCodeResponseSchema = updateErrorCodeResponse; 