import { z } from 'zod';

/**
 * Base schema for error code validation with common fields
 */
export const errorCodeBaseSchema = z.object({
  code: z.string()
    .min(3, 'Error code must be at least 3 characters')
    .max(50, 'Error code must be at most 50 characters')
    .regex(/^[A-Z0-9_]+(\.[A-Z0-9_]+)+$/, 'Error code must follow the format DOMAIN.ERROR_NAME'),
  defaultMessage: z.string()
    .min(1, 'Default message is required')
    .max(500, 'Default message must be at most 500 characters'),
});

export type ErrorCodeBase = z.infer<typeof errorCodeBaseSchema>; 