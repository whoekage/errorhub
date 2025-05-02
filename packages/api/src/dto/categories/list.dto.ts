import { z } from 'zod';
import { paginationSchema, createPaginatedResponseSchema } from '@/dto/common/pagination.dto';
import { createErrorCategoryResponse } from './create.dto';

/**
 * Schema for listing error categories with pagination (request)
 */
export const listErrorCategoriesRequest = paginationSchema.extend({
  searchTerm: z.string().optional(),
});

/**
 * Schema for error category list response
 */
export const listErrorCategoriesResponse = createPaginatedResponseSchema(createErrorCategoryResponse);

/**
 * Schema for a non-paginated list of error categories
 */
export const errorCategoryListResponse = z.array(createErrorCategoryResponse);

// Backward compatibility
export const listErrorCategoriesRequestSchema = listErrorCategoriesRequest;
export const listErrorCategoriesResponseSchema = listErrorCategoriesResponse;
export const errorCategoryListResponseSchema = errorCategoryListResponse; 