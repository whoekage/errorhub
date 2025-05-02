import { z } from 'zod';
import { paginationSchema, createPaginatedResponseSchema } from '@/dto/common/pagination.dto';
import { createErrorCodeResponse } from './create.dto';

/**
 * Schema for listing error codes with pagination (request)
 */
export const listErrorCodesRequest = paginationSchema.extend({
  category: z.string().optional(),
  searchTerm: z.string().optional(),
});

/**
 * Schema for error code list response
 */
export const listErrorCodesResponse = createPaginatedResponseSchema(createErrorCodeResponse);

/**
 * Schema for a non-paginated list of error codes
 */
export const errorCodeListResponse = z.array(createErrorCodeResponse);

// Backward compatibility
export const listErrorCodesRequestSchema = listErrorCodesRequest;
export const listErrorCodesResponseSchema = listErrorCodesResponse;
export const errorCodeListResponseSchema = errorCodeListResponse;