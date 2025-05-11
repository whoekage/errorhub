import { z } from 'zod';
import { errorCodeBaseSchema } from './base.dto';
import { errorCodeResponseSchema } from './create.dto';

/**
 * Schema for updating an existing error code (request payload).
 * All fields from errorCodeBaseSchema, including 'code', are made optional.
 */
export const updateErrorCodeRequestSchema = errorCodeBaseSchema.partial();

export type UpdateErrorCodeRequestDto = z.infer<typeof updateErrorCodeRequestSchema>;

/**
 * Schema for the response when an error code is updated.
 * Uses the same detailed response schema as for creation.
 */
export const updateErrorCodeResponseSchema = errorCodeResponseSchema;

// For clarity and if other parts of the application expect these specific names:
// export const updateErrorCodeRequest = updateErrorCodeRequestSchema;
// export const updateErrorCodeResponse = updateErrorCodeResponseSchema;
// export const updateErrorCodeSchema = updateErrorCodeRequestSchema; 