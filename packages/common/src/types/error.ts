import { z } from 'zod';

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error', 
  CRITICAL = 'critical',
}

/**
 * Error categories
 */
export enum ErrorCategory {
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  VALIDATION = 'validation',
  NETWORK = 'network',
  SERVER = 'server',
  DATABASE = 'database',
  PAYMENT = 'payment',
  USER = 'user',
  GENERAL = 'general',
}

/**
 * Basic error information
 */
export const ErrorSchema = z.object({
  code: z.string(),
  defaultMessage: z.string(),
  severity: z.nativeEnum(ErrorSeverity),
  category: z.nativeEnum(ErrorCategory),
  httpStatus: z.number().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  version: z.number().default(1),
});

export type Error = z.infer<typeof ErrorSchema>;

/**
 * Error translation
 */
export const ErrorTranslationSchema = z.object({
  errorCode: z.string(),
  language: z.string(),
  message: z.string(),
  isComplete: z.boolean().default(true),
  lastUpdated: z.date().optional(),
});

export type ErrorTranslation = z.infer<typeof ErrorTranslationSchema>;

/**
 * Localized error (with translation)
 */
export const LocalizedErrorSchema = ErrorSchema.extend({
  message: z.string(),
  locale: z.string(),
  isFallback: z.boolean().optional(),
});

export type LocalizedError = z.infer<typeof LocalizedErrorSchema>;

/**
 * Error request
 */
export const ErrorRequestSchema = z.object({
  code: z.string(),
  language: z.string(),
  params: z.record(z.string(), z.string()).optional(),
  version: z.number().optional(),
});

export type ErrorRequest = z.infer<typeof ErrorRequestSchema>; 