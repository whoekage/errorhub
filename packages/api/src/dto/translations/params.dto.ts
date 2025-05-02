import { z } from 'zod';
import { numericIdParamSchema, createStringParamSchema } from '@/dto/common/params.dto';

/**
 * Translation ID parameter schema
 */
export const translationIdParamSchema = numericIdParamSchema;
export type TranslationIdParam = z.infer<typeof translationIdParamSchema>;

/**
 * Language parameter schema
 */
export const languageParamSchema = createStringParamSchema('language', {
  minLength: 2,
  maxLength: 10,
  errorMsg: 'Language code must be between 2 and 10 characters'
});
export type LanguageParam = z.infer<typeof languageParamSchema>; 