import { z } from 'zod';
import { numericIdParamSchema } from '@/dto/common/params.dto';

/**
 * Category ID parameter schema
 */
export const categoryIdParamSchema = numericIdParamSchema;
export type CategoryIdParam = z.infer<typeof categoryIdParamSchema>; 