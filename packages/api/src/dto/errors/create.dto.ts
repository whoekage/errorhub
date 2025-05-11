import { z } from 'zod';
import { errorCodeBaseSchema } from './base.dto';

/**
 * Schema for creating a new error code (request payload)
 * It directly uses the base schema, which now includes optional context, translations, categoryIds, and status.
 */
export const createErrorCodeRequestSchema = errorCodeBaseSchema;

// --- Response Schemas --- 

/**
 * Schema for representing a category within an error code response.
 */
const categoryInErrorResponseSchema = z.object({
  id: z.number().int().positive(),
  name: z.string(),
  description: z.string().optional(),
});

/**
 * Schema for representing a translation within an error code response.
 */
const translationInErrorResponseSchema = z.object({
  // id: z.number().int().positive(), // ID of the translation record itself
  languageCode: z.string(), // e.g., 'en', 'ru'
  message: z.string(),
  // context for individual translation is usually not needed as context is per error code
});

/**
 * Schema for the response when an error code is created or fetched.
 * This should reflect the ErrorCodeEntity structure more closely.
 */
export const errorCodeResponseSchema = errorCodeBaseSchema.extend({
  id: z.number().int().positive(),
  // status is already in errorCodeBaseSchema, and it's an enum ['draft', 'published']
  // If we extend, it will be there. If we need to override or ensure, we can restate it.
  // For now, relying on it being inherited from errorCodeBaseSchema which now has status.
  
  createdAt: z.string().datetime({ message: "Invalid createdAt date format" }).or(z.date()),
  updatedAt: z.string().datetime({ message: "Invalid updatedAt date format" }).or(z.date()),
  
  // category is removed
  // category: categoryInErrorResponseSchema.nullable().optional(),
  
  // categories is added as an array of category objects
  categories: z.array(categoryInErrorResponseSchema).optional()
    .describe('An array of category objects associated with the error code.'),
  
  // Override translations from base for response to be an array of objects
  // This is already correctly defined as an array for the response.
  translations: z.array(translationInErrorResponseSchema).optional(), 
});

// Maintaining existing export names for compatibility if they are used elsewhere, but pointing to new schemas
export const createErrorCodeRequest = createErrorCodeRequestSchema;
export const createErrorCodeResponseSchema = errorCodeResponseSchema; // For clarity, use more descriptive name
export const createErrorCodeResponse = errorCodeResponseSchema; // Legacy alias if used elsewhere 