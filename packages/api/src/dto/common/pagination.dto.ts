import { z } from 'zod';

/**
 * Base schema for pagination parameters
 */
export const paginationSchema = z.object({
  page: z.number()
    .int('Page must be an integer')
    .positive('Page must be a positive integer')
    .default(1)
    .optional(),
  limit: z.number()
    .int('Limit must be an integer')
    .positive('Limit must be a positive integer')
    .max(100, 'Limit cannot exceed 100 items per page')
    .default(20)
    .optional(),
});

export type PaginationDto = z.infer<typeof paginationSchema>;

/**
 * Schema for paginated response metadata
 */
export const paginationMetaSchema = z.object({
  currentPage: z.number().int().positive(),
  totalPages: z.number().int().nonnegative(),
  totalItems: z.number().int().nonnegative(),
  itemsPerPage: z.number().int().positive(),
});

export type PaginationMeta = z.infer<typeof paginationMetaSchema>;

/**
 * Generic schema for a paginated response
 */
export function createPaginatedResponseSchema<T extends z.ZodType>(itemSchema: T) {
  return z.object({
    data: z.array(itemSchema),
    meta: paginationMetaSchema,
  });
}

export type PaginatedResponse<T> = {
  data: T[];
  meta: PaginationMeta;
}; 