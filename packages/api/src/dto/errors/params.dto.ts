import { z } from 'zod';
import { createStringParamSchema } from '@/dto/common/params.dto';

/**
 * Error code parameter schema
 */
export const errorCodeParamSchema = createStringParamSchema('code', {
  minLength: 3,
  maxLength: 50,
  pattern: /^[A-Z0-9_]+(\.[A-Z0-9_]+)+$/,
  errorMsg: 'Error code must follow the format DOMAIN.ERROR_NAME'
});

export type ErrorCodeParam = z.infer<typeof errorCodeParamSchema>;

/**
 * Parameters for error by category routes
 */
export const errorByCategoryParamSchema = z.object({
  categoryId: z.string()
    .transform(val => parseInt(val, 10))
    .refine(val => !isNaN(val) && val > 0, 'Category ID must be a positive integer')
});

export type ErrorByCategoryParam = z.infer<typeof errorByCategoryParamSchema>; 