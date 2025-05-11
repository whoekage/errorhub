import { z } from 'zod';

/**
 * Base schema for offset (page-based) pagination parameters
 */
export const paginationSchema = z.object({
  page: z.coerce.number()
    .int('Page must be an integer')
    .positive('Page must be a positive integer')
    .default(1)
    .optional(),
  limit: z.coerce.number()
    .int('Limit must be an integer')
    .positive('Limit must be a positive integer')
    .default(20)
    .optional(),
  sort: z.string().default('id').optional(),
  order: z.enum(['ASC', 'DESC']).default('ASC').optional(),
  include: z.string().optional(),
  search: z.string().optional(),
});

export type PaginationDto = z.infer<typeof paginationSchema>;

export interface PaginationMeta {
  totalItems: number;
  itemsPerPage: number;
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
  links: {
    next?: string; // URL with ?page=next
    prev?: string; // URL with ?page=prev
  };
}

// Remove the old schema definitions if they exist
// ... existing code ... // (Remove paginationMetaSchema and createPaginatedResponseSchema if present) 