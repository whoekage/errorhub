import { z } from 'zod';

/**
 * Base schema for pagination parameters with support for offset, keyset, sorting, filtering, and relations
 */
export const paginationSchema = z.object({
  // Offset pagination parameters
  page: z.coerce.number()
    .int('Page must be an integer')
    .positive('Page must be a positive integer')
    .default(1)
    .optional(),
  limit: z.coerce.number()
    .int('Limit must be an integer')
    .positive('Limit must be a positive integer')
    .max(100, 'Limit cannot exceed 100 items per page')
    .default(20)
    .optional(),

  // Keyset pagination parameters
  startId: z.string().optional(),
  startValue: z.string().optional(), // For combined keyset pagination

  // Sorting parameters
  sort: z.string().default('id').optional(),
  order: z.enum(['ASC', 'DESC']).default('ASC').optional(),

  // Include related entities
  include: z.string().optional(),

  // Search across multiple fields
  search: z.string().optional(),
});

export type PaginationDto = z.infer<typeof paginationSchema>;

/**
 * Pagination metadata interface
 */
export interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * Generic interface for a paginated response
 */
export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
  links?: {
    first?: string;
    prev?: string;
    next?: string;
    last?: string;
  };
}

// Remove the old schema definitions if they exist
// ... existing code ... // (Remove paginationMetaSchema and createPaginatedResponseSchema if present) 