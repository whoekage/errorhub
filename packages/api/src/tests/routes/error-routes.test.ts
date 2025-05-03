import { describe, it, expect, beforeEach } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildTestApp } from '../utils/app-helper';
import { TestData } from '../utils/test-data';

describe('Error Routes', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    // Create a fresh test app for each test
    app = await buildTestApp();
  });

  describe('GET /api/errors', () => {
    it('returns an empty array when no errors exist', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/errors',
      });

      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.payload)).toEqual([]);
    });

    it('returns all error codes when they exist', async () => {
      // Seed some error codes in the database
      const errorCode1 = await TestData.seedErrorCode({
        code: 'TEST.ERROR_1',
        defaultMessage: 'Test error 1'
      });
      
      const errorCode2 = await TestData.seedErrorCode({
        code: 'TEST.ERROR_2',
        defaultMessage: 'Test error 2'
      });

      const response = await app.inject({
        method: 'GET',
        url: '/api/errors',
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      
      expect(result).toHaveLength(2);
      expect(result).toEqual(expect.arrayContaining([
        expect.objectContaining({ code: errorCode1.code }),
        expect.objectContaining({ code: errorCode2.code })
      ]));
    });

    it('includes related data when include parameter is specified', async () => {
      // Seed an error code with translations
      const errorCode = await TestData.seedErrorCode({
        code: 'TEST.INCLUDE_RELATIONS',
        defaultMessage: 'Test with translations'
      });
      
      await TestData.seedErrorTranslation({
        errorCode,
        language: 'fr',
        message: 'Message en français'
      });
      
      await TestData.seedErrorTranslation({
        errorCode,
        language: 'es',
        message: 'Mensaje en español'
      });

      const response = await app.inject({
        method: 'GET',
        url: '/api/errors?include=translations',
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      
      const foundErrorCode = result.find(e => e.code === errorCode.code);
      expect(foundErrorCode).toBeDefined();
      expect(foundErrorCode.translations).toBeDefined();
      expect(foundErrorCode.translations.length).toBe(2);
    });

    it('filters results when filter parameter is provided', async () => {
      // Seed error codes with different prefixes
      await TestData.seedErrorCode({ code: 'AUTH.ERROR_1' });
      await TestData.seedErrorCode({ code: 'AUTH.ERROR_2' });
      await TestData.seedErrorCode({ code: 'PAYMENT.ERROR_1' });

      const response = await app.inject({
        method: 'GET',
        url: '/api/errors?filter=AUTH',
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      
      expect(result.length).toBe(2);
      expect(result.every(e => e.code.startsWith('AUTH.'))).toBe(true);
    });
  });

  describe('GET /api/errors/:code', () => {
    it('returns 404 when error code does not exist', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/errors/NONEXISTENT.ERROR',
      });

      expect(response.statusCode).toBe(404);
    });

    it('returns error code data when it exists', async () => {
      // Seed a test error code
      const errorCode = await TestData.seedErrorCode({
        code: 'TEST.GET_BY_CODE',
        defaultMessage: 'Test get by code'
      });

      const response = await app.inject({
        method: 'GET',
        url: `/api/errors/${errorCode.code}`,
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      
      expect(result.code).toBe(errorCode.code);
      expect(result.message).toBe(errorCode.defaultMessage);
    });

    it('returns translated message when lang parameter is provided', async () => {
      // Seed a test error code with translation
      const errorCode = await TestData.seedErrorCode({
        code: 'TEST.TRANSLATION',
        defaultMessage: 'Test translation'
      });
      
      await TestData.seedErrorTranslation({
        errorCode,
        language: 'fr',
        message: 'Test de traduction'
      });

      const response = await app.inject({
        method: 'GET',
        url: `/api/errors/${errorCode.code}?lang=fr`,
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      
      expect(result.code).toBe(errorCode.code);
      expect(result.message).toBe('Test de traduction');
      expect(result.locale).toBe('fr');
    });
  });

  describe('POST /api/errors', () => {
    it('creates a new error code', async () => {
      // Create a test category first
      const category = await TestData.seedCategory();
      
      const payload = {
        code: 'TEST.CREATE',
        defaultMessage: 'Test create error',
        categoryId: category.id
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/errors',
        payload
      });

      expect(response.statusCode).toBe(201);
      const result = JSON.parse(response.payload);
      
      expect(result.code).toBe(payload.code);
      expect(result.defaultMessage).toBe(payload.defaultMessage);
      expect(result.categoryId).toBe(category.id);
    });

    it('returns validation error for invalid code format', async () => {
      const payload = {
        code: 'invalid-code', // Should be uppercase with dots
        defaultMessage: 'Test validation'
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/errors',
        payload
      });

      expect(response.statusCode).toBe(400);
      const result = JSON.parse(response.payload);
      expect(result.error).toBe('Validation Error');
    });

    it('returns conflict error when code already exists', async () => {
      // First, seed an error code
      const existingError = await TestData.seedErrorCode({
        code: 'TEST.DUPLICATE',
        defaultMessage: 'Original message'
      });

      // Create category for the new error
      const category = await TestData.seedCategory();

      // Then try to create another with the same code
      const payload = {
        code: existingError.code,
        defaultMessage: 'Duplicate error code',
        categoryId: category.id
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/errors',
        payload
      });

      expect(response.statusCode).toBe(409);
    });

    it('handles error codes with complex format', async () => {
      // Create a complex error code
      const category = await TestData.seedCategory();
      const payload = {
        code: 'TEST.COMPLEX_123.SUB_ERROR',
        defaultMessage: 'Complex error code test',
        categoryId: category.id
      };

      // Create the error
      const createResponse = await app.inject({
        method: 'POST',
        url: '/api/errors',
        payload
      });

      expect(createResponse.statusCode).toBe(201);
      
      // Retrieve the error
      const getResponse = await app.inject({
        method: 'GET',
        url: `/api/errors/${payload.code}`,
      });

      expect(getResponse.statusCode).toBe(200);
      const result = JSON.parse(getResponse.payload);
      expect(result.code).toBe(payload.code);
    });

    it('correctly handles language fallback for translations', async () => {
      // Create error with only Spanish translation
      const errorCode = await TestData.seedErrorCode({
        code: 'TEST.LANGUAGE_FALLBACK',
        defaultMessage: 'Default message'
      });
      
      await TestData.seedErrorTranslation({
        errorCode,
        language: 'es',
        message: 'Mensaje en español'
      });

      // Request with non-existent language
      const response = await app.inject({
        method: 'GET',
        url: `/api/errors/${errorCode.code}?lang=fr`,  // French not available
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      
      // Should fall back to default message
      expect(result.message).toBe('Default message');
      expect(result.locale).toBe('default');
    });
  });

  describe('PUT /api/errors/:code', () => {
    it('updates an existing error code', async () => {
      // Seed a test error code
      const errorCode = await TestData.seedErrorCode({
        code: 'TEST.UPDATE',
        defaultMessage: 'Original message'
      });

      const payload = {
        defaultMessage: 'Updated message'
      };

      const response = await app.inject({
        method: 'PUT',
        url: `/api/errors/${errorCode.code}`,
        payload
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      
      expect(result.code).toBe(errorCode.code);
      expect(result.defaultMessage).toBe('Updated message');
    });

    it('returns 404 when error code does not exist', async () => {
      const response = await app.inject({
        method: 'PUT',
        url: '/api/errors/NONEXISTENT.ERROR',
        payload: {
          defaultMessage: 'This will not be updated'
        }
      });

      expect(response.statusCode).toBe(404);
    });

    it('validates input data and returns error for invalid data', async () => {
      // Seed a test error code
      const errorCode = await TestData.seedErrorCode({
        code: 'TEST.UPDATE_VALIDATION',
        defaultMessage: 'Original message'
      });

      // Invalid update payload (empty message)
      const payload = {
        defaultMessage: ''  // Empty message is invalid
      };

      const response = await app.inject({
        method: 'PUT',
        url: `/api/errors/${errorCode.code}`,
        payload
      });

      expect(response.statusCode).toBe(400);
      const result = JSON.parse(response.payload);
      expect(result.error).toBe('Validation Error');
    });

    it('updates category association', async () => {
      // Seed a test error code with category
      const originalCategory = await TestData.seedCategory({ name: 'Original Category' });
      const errorCode = await TestData.seedErrorCode({
        code: 'TEST.UPDATE_CATEGORY',
        categoryId: originalCategory.id
      });
      
      // Create a new category
      const newCategory = await TestData.seedCategory({ name: 'New Category' });

      // Update with new category
      const payload = {
        categoryId: newCategory.id
      };

      const response = await app.inject({
        method: 'PUT',
        url: `/api/errors/${errorCode.code}`,
        payload
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      expect(result.categoryId).toBe(newCategory.id);
    });
  });

  describe('DELETE /api/errors/:code', () => {
    it('deletes an existing error code', async () => {
      // Seed a test error code
      const errorCode = await TestData.seedErrorCode({
        code: 'TEST.DELETE',
        defaultMessage: 'Test delete'
      });

      const response = await app.inject({
        method: 'DELETE',
        url: `/api/errors/${errorCode.code}`
      });

      expect(response.statusCode).toBe(204);
      
      // Verify it was deleted
      const checkResponse = await app.inject({
        method: 'GET',
        url: `/api/errors/${errorCode.code}`
      });
      
      expect(checkResponse.statusCode).toBe(404);
    });

    it('returns 404 when error code does not exist', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: '/api/errors/NONEXISTENT.ERROR'
      });

      expect(response.statusCode).toBe(404);
    });

    it('cascade deletes related translations', async () => {
      // Seed error code with translations
      const errorCode = await TestData.seedErrorCode({
        code: 'TEST.CASCADE_DELETE'
      });
      
      await TestData.seedErrorTranslation({
        errorCode,
        language: 'fr'
      });
      
      // Delete the error code
      const response = await app.inject({
        method: 'DELETE',
        url: `/api/errors/${errorCode.code}`
      });

      expect(response.statusCode).toBe(204);
      
      // Verify translations were deleted
      const getResponse = await app.inject({
        method: 'GET',
        url: `/api/translations/by-error/${errorCode.code}`
      });
      
      expect(getResponse.statusCode).toBe(404);
    });
  });

  describe('GET /api/errors/category/:categoryId', () => {
    it('retrieves error codes by category ID', async () => {
      // Create a category
      const category = await TestData.seedCategory();
      
      // Create error codes in this category
      await TestData.seedErrorCode({
        code: 'TEST.CATEGORY_1',
        categoryId: category.id
      });
      
      await TestData.seedErrorCode({
        code: 'TEST.CATEGORY_2',
        categoryId: category.id
      });
      
      // Create an error in another category
      const otherCategory = await TestData.seedCategory();
      await TestData.seedErrorCode({
        code: 'TEST.OTHER_CATEGORY',
        categoryId: otherCategory.id
      });

      // Get errors by category
      const response = await app.inject({
        method: 'GET',
        url: `/api/errors/category/${category.id}`,
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      
      expect(result.length).toBe(2);
      expect(result.every(e => e.categoryId === category.id)).toBe(true);
    });
  });
}); 