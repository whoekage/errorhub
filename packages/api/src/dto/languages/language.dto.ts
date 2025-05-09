import { z } from 'zod';

export const updateLanguagesRequestSchema = z.object({
  enabledLanguages: z.array(z.string().min(2).max(10))
});

export type UpdateLanguagesRequest = z.infer<typeof updateLanguagesRequestSchema>;

export const languageInfoSchema = z.object({
  code: z.string(),
  name: z.string(),
  native: z.string(),
  rtl: z.boolean(),
  enabled: z.boolean()
});

export type LanguageInfo = z.infer<typeof languageInfoSchema>;

export const languagesResponseSchema = z.object({
  languages: z.array(languageInfoSchema)
});

export type LanguagesResponse = z.infer<typeof languagesResponseSchema>; 