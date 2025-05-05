import { z } from 'zod';
import { paginationSchema, createPaginatedResponseSchema } from '@/dto/common/pagination.dto';
import { upsertTranslationResponse } from './upsert.dto';

/**
 * Schema for listing error translations with pagination (request)
 */
export const listErrorTranslationsRequest = paginationSchema.extend({
  errorCode: z.string().optional(),
  language: z.string().optional(),
});

/**
 * Schema for error translation list response
 */
export const listErrorTranslationsResponse = createPaginatedResponseSchema(upsertTranslationResponse);

/**
 * Schema for a non-paginated list of error translations
 */
export const errorTranslationListResponse = z.array(upsertTranslationResponse);

// Backward compatibility
export const listErrorTranslationsRequestSchema = listErrorTranslationsRequest;
export const listErrorTranslationsResponseSchema = listErrorTranslationsResponse;
export const errorTranslationListResponseSchema = errorTranslationListResponse; 