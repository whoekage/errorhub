import { z } from 'zod';

/**
 * Base schema for error code validation with common fields
 */
export const errorCodeBaseSchema = z.object({
  code: z.string()
    .min(3, 'Error code must be at least 3 characters')
    .max(255, 'Error code must be at most 255 characters long')
    .regex(/^[A-Z0-9_]+(\.[A-Z0-9_]+)*$/, 'Invalid code format. Use uppercase letters, numbers, underscores, and dots.'),
  
  categoryIds: z.array(z.number().int().positive({
    message: 'Category ID must be a positive integer.'
  })).optional().describe('An array of category IDs to associate with the error code.'),
  
  context: z.string().max(5000, 'Context must be at most 5000 characters').optional(),
  
  translations: z.record(z.string(), z.string().optional()).optional()
    .describe('Optional translations for the error code, mapping language codes to messages.'),

  status: z.enum(['draft', 'published']).optional()
    .describe('The status of the error code, e.g., draft or published.'),
});

export type ErrorCodeBase = z.infer<typeof errorCodeBaseSchema>; 