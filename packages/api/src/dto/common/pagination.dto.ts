import { z } from 'zod';

/**
 * Base schema for pagination parameters with support for offset, keyset, sorting, filtering, and relations
 */
export const paginationSchema = z.object({
  limit: z.coerce.number()
    .int('Limit must be an integer')
    .positive('Limit must be a positive integer')
    .max(100, 'Limit cannot exceed 100 items per page')
    .default(20)
    .optional(),

  cursor: z.string().optional(), // Base64-encoded cursor
  sort: z.string().default('id').optional(),
  order: z.enum(['ASC', 'DESC']).default('ASC').optional(),
  direction: z.enum(['next', 'prev']).default('next').optional(),

  include: z.string().optional(),
  search: z.string().optional(),
});


export type PaginationDto = z.infer<typeof paginationSchema>;

export interface PaginationMeta {
  totalItems?: number; // Optional, only if reasonably calculable
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
  links: {
    next?: string; // Contains encoded cursor
    prev?: string; // Contains encoded cursor
  };
}

// Remove the old schema definitions if they exist
// ... existing code ... // (Remove paginationMetaSchema and createPaginatedResponseSchema if present) 