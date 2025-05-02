import { z } from 'zod';

/**
 * String ID parameter schema (for string IDs like error codes)
 */
export const stringIdParamSchema = z.object({
  code: z.string()
    .min(1, 'ID is required')
});

export type StringIdParam = z.infer<typeof stringIdParamSchema>;

/**
 * Numeric ID parameter schema (for numeric IDs like category IDs)
 */
export const numericIdParamSchema = z.object({
  id: z.string()
    .transform(val => parseInt(val, 10))
    .refine(val => !isNaN(val) && val > 0, 'ID must be a positive integer')
});

export type NumericIdParam = z.infer<typeof numericIdParamSchema>;

/**
 * Create a custom numeric ID parameter schema with a specific field name
 */
export function createNumericParamSchema(field: string, errorMsg?: string) {
  return z.object({
    [field]: z.string()
      .transform(val => parseInt(val, 10))
      .refine(val => !isNaN(val) && val > 0, errorMsg || `${field} must be a positive integer`)
  });
}

/**
 * Create a custom string ID parameter schema with a specific field name
 */
export function createStringParamSchema(field: string, options?: { 
  minLength?: number, 
  maxLength?: number, 
  pattern?: RegExp,
  errorMsg?: string 
}) {
  let schema = z.string().min(options?.minLength || 1, options?.errorMsg || `${field} is required`);
  
  if (options?.maxLength) {
    schema = schema.max(options.maxLength, `${field} must be at most ${options.maxLength} characters`);
  }
  
  if (options?.pattern) {
    schema = schema.regex(options.pattern, options.errorMsg || `${field} format is invalid`);
  }
  
  return z.object({ [field]: schema });
} 