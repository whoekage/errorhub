import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildTestApp } from '@/tests/setup'; // Corrected path to setup.ts
import { TestData } from '@/tests/utils/test-data';   // Assuming this path is correct, adjust if TestData is elsewhere
import { ErrorCodeEntity, ErrorCategoryEntity, ErrorTranslationEntity } from '@/db'; // Using @ alias for db entities
import { createErrorCodeRequestSchema } from '@/dto/errors/create.dto'; // Using @ alias for DTOs
import { z } from 'zod';

type CreateErrorCodeRequestDto = z.infer<typeof createErrorCodeRequestSchema>;

describe('POST /api/errors - Create Error Code', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    // buildTestApp is defined in @/tests/setup.ts and should correctly initialize the app
    // The global beforeEach in setup.ts handles data cleaning.
    app = await buildTestApp(); 
  });

  afterEach(async () => {
    if (app) {
        await app.close();
    }
  });

  it('successfully creates a new error code with minimal valid data', async () => {
    const payload: CreateErrorCodeRequestDto = {
      code: 'TEST.MINIMAL_CREATE',
    };

    const response = await app.inject({
      method: 'POST',
      url: '/api/errors',
      payload,
    });

    expect(response.statusCode).toBe(201);
    const result: ErrorCodeEntity = JSON.parse(response.payload);
    
    expect(result.code).toBe(payload.code);
    // For minimal data, context might be null or undefined based on entity definition.
    // Assuming it defaults to null or is explicitly set to null if not provided.
    expect(result.context === null || result.context === undefined).toBe(true);
    expect(result.status).toBe('draft'); 
    expect(result.categories).toEqual([]); 
    expect(result.translations).toEqual([]); 
  });

  it('successfully creates a new error code with all fields populated', async () => {
    const category1 = await TestData.seedCategory({ name: 'Category One' });
    const category2 = await TestData.seedCategory({ name: 'Category Two' });

    const payload: CreateErrorCodeRequestDto = {
      code: 'TEST.FULL_CREATE',
      context: 'This is a full test context.',
      status: 'published',
      categoryIds: [category1.id, category2.id],
      translations: {
        'en': 'English message',
        'fr': 'Message en français',
      },
    };

    const response = await app.inject({
      method: 'POST',
      url: '/api/errors',
      payload,
    });

    expect(response.statusCode).toBe(201);
    const result: ErrorCodeEntity = JSON.parse(response.payload);

    expect(result.code).toBe(payload.code);
    expect(result.context).toBe(payload.context);
    expect(result.status).toBe(payload.status);
    expect(result.categories).toHaveLength(2);
    expect(result.categories.map((cat: ErrorCategoryEntity) => cat.id).sort())
      .toEqual([category1.id, category2.id].sort());
    expect(result.translations).toHaveLength(2);
    const returnedTranslations = result.translations.map((t: ErrorTranslationEntity) => ({ lang: t.language, msg: t.message }));
    expect(returnedTranslations).toEqual(expect.arrayContaining([
      { lang: 'en', msg: 'English message' },
      { lang: 'fr', msg: 'Message en français' },
    ]));
  });

  it('returns 400 validation error for invalid code format', async () => {
    const payload: Partial<CreateErrorCodeRequestDto> = {
      code: 'invalid-code', 
    };

    const response = await app.inject({
      method: 'POST',
      url: '/api/errors',
      payload,
    });

    expect(response.statusCode).toBe(400);
    const resultJson = JSON.parse(response.payload);
    expect(resultJson.error).toBe('Validation Error');
    expect(resultJson.message).toContain('Invalid code format');
  });
  
  it('returns 400 validation error for invalid categoryIds (not an array)', async () => {
    const payload = {
      code: 'TEST.INVALID_CAT_IDS',
      categoryIds: 123, 
    };

    const response = await app.inject({
      method: 'POST',
      url: '/api/errors',
      payload: payload as any, // Kept 'as any' for intentionally invalid test payload
    });
    expect(response.statusCode).toBe(400);
    const resultJson = JSON.parse(response.payload);
    expect(resultJson.error).toBe('Validation Error');
  });

  it('returns 400 validation error for invalid translations (value not a string)', async () => {
    const payload = {
      code: 'TEST.INVALID_TRANSLATIONS',
      translations: { 'en': 123 }, 
    };
    const response = await app.inject({
      method: 'POST',
      url: '/api/errors',
      payload: payload as any, // Kept 'as any'
    });
    expect(response.statusCode).toBe(400);
    const resultJson = JSON.parse(response.payload);
    expect(resultJson.error).toBe('Validation Error');
  });
  
  it('returns 400 validation error for invalid status', async () => {
    const payload = {
      code: 'TEST.INVALID_STATUS',
      status: 'archived', 
    };
    const response = await app.inject({
      method: 'POST',
      url: '/api/errors',
      payload: payload as any, // Kept 'as any'
    });
    expect(response.statusCode).toBe(400);
    const resultJson = JSON.parse(response.payload);
    expect(resultJson.error).toBe('Validation Error');
  });

  it('returns 409 conflict error when code already exists', async () => {
    await TestData.seedErrorCode({ code: 'TEST.DUPLICATE_CODE' });

    const payload: CreateErrorCodeRequestDto = {
      code: 'TEST.DUPLICATE_CODE',
    };

    const response = await app.inject({
      method: 'POST',
      url: '/api/errors',
      payload,
    });

    expect(response.statusCode).toBe(409);
    const resultJson = JSON.parse(response.payload);
    expect(resultJson.error).toBe('ResourceConflictError');
  });

  it('creates error code but ignores non-existent categoryIds, associating only existing ones', async () => {
    const existingCategory = await TestData.seedCategory({ name: "Real Category" });
    const payload: CreateErrorCodeRequestDto = {
      code: 'TEST.CATEGORY_IGNORE_NONEXISTENT',
      categoryIds: [existingCategory.id, 99999], // 99999 does not exist
    };

    const response = await app.inject({
      method: 'POST',
      url: '/api/errors',
      payload,
    });

    expect(response.statusCode).toBe(201);
    const result: ErrorCodeEntity = JSON.parse(response.payload);
    expect(result.categories).toHaveLength(1);
    expect(result.categories[0].id).toBe(existingCategory.id);
  });
  
  it('successfully creates error code with only valid translations provided', async () => {
    const payload: CreateErrorCodeRequestDto = {
      code: 'TEST.VALID_TRANSLATIONS_ONLY',
      translations: {
        'en': 'Valid English',
        'it': 'Valid Italian'
      }
    };

    const response = await app.inject({
      method: 'POST',
      url: '/api/errors',
      payload
    });
    
    expect(response.statusCode).toBe(201);
    const result: ErrorCodeEntity = JSON.parse(response.payload);
    expect(result.translations).toHaveLength(2);
    const languages = result.translations.map((t: ErrorTranslationEntity) => t.language);
    expect(languages).toEqual(expect.arrayContaining(['en', 'it']));
  });

  it('returns 400 validation error if any translation message is invalid (empty, null, or spaces)', async () => {
    const payload = {
      code: 'TEST.INVALID_TRANSLATION_VALUES',
      translations: {
        'en': 'Valid English',
        'fr': '   ',      
        'de': null,          
        'es': '',           
        'it': 'Valid Italian'
      }
    };

    const response = await app.inject({
      method: 'POST',
      url: '/api/errors',
      payload: payload as any 
    });
    
    expect(response.statusCode).toBe(400);
    const resultJson = JSON.parse(response.payload);
    expect(resultJson.error).toBe('Validation Error');
  });

  // New tests for code validation
  it('returns 400 validation error if code is an empty string', async () => {
    const payload = { code: '' };
    const response = await app.inject({
      method: 'POST',
      url: '/api/errors',
      payload: payload as Partial<CreateErrorCodeRequestDto> // Use Partial as other fields are missing
    });
    expect(response.statusCode).toBe(400);
    const resultJson = JSON.parse(response.payload);
    expect(resultJson.error).toBe('Validation Error');
    // Check for a message indicating code is required or invalid format
    expect(resultJson.message).toMatch(/code/i);
  });

  it('returns 400 validation error if code is not provided', async () => {
    const payload = {}; // Code is undefined
    const response = await app.inject({
      method: 'POST',
      url: '/api/errors',
      payload: payload as Partial<CreateErrorCodeRequestDto>
    });
    expect(response.statusCode).toBe(400);
    const resultJson = JSON.parse(response.payload);
    expect(resultJson.error).toBe('Validation Error');
    expect(resultJson.message).toMatch(/code/i); 
  });

  // New tests for translation language key validation
  it('returns 400 validation error if a translation language key is too short', async () => {
    const payload = {
      code: 'TEST.LANG_KEY_SHORT',
      translations: { 'e': 'message' } // 'e' is too short
    };
    const response = await app.inject({
      method: 'POST',
      url: '/api/errors',
      payload: payload as any 
    });
    expect(response.statusCode).toBe(400);
    const resultJson = JSON.parse(response.payload);
    expect(resultJson.error).toBe('Validation Error');
    // Zod error messages for records might be nested, e.g. "translations.e.language" or similar
    // For now, a general check is okay, can be refined if specific path is known.
    expect(resultJson.message).toMatch(/language code must be at least 2 characters/i);
  });

  it('returns 400 validation error if a translation language key is too long', async () => {
    const payload = {
      code: 'TEST.LANG_KEY_LONG',
      translations: { 'abcdefghijklm': 'message' } // too long
    };
    const response = await app.inject({
      method: 'POST',
      url: '/api/errors',
      payload: payload as any
    });
    expect(response.statusCode).toBe(400);
    const resultJson = JSON.parse(response.payload);
    expect(resultJson.error).toBe('Validation Error');
    expect(resultJson.message).toMatch(/language code must be at most 10 characters/i);
  });

}); 