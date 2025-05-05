// packages/api/src/dto/translations/upsert.dto.ts
import { z } from 'zod';

/**
 * Schema for upserting an error translation (request)
 */
export const upsertTranslationRequest = z.object({
  errorCode: z.string()
    .min(3, 'Error code must be at least 3 characters')
    .max(50, 'Error code must be at most 50 characters')
    .regex(/^[A-Z0-9_]+(\.[A-Z0-9_]+)+$/, 'Error code must follow the format DOMAIN.ERROR_NAME'),
  language: z.string()
    .min(2, 'Language code must be at least 2 characters')
    .max(10, 'Language code must be at most 10 characters'),
  message: z.string()
    .min(1, 'Message is required')
    .max(500, 'Message must be at most 500 characters'),
});

/**
 * Schema for error translation response after upsert
 */
export const upsertTranslationResponse = z.object({
  id: z.number().int().positive(),
  errorCode: z.string()
    .min(3, 'Error code must be at least 3 characters')
    .max(50, 'Error code must be at most 50 characters'),
  language: z.string()
    .min(2, 'Language code must be at least 2 characters')
    .max(10, 'Language code must be at most 10 characters'),
  message: z.string(),
  createdAt: z.string().or(z.date()),
  updatedAt: z.string().or(z.date()),
});

export type UpsertTranslationRequest = z.infer<typeof upsertTranslationRequest>;
export type UpsertTranslationResponse = z.infer<typeof upsertTranslationResponse>;