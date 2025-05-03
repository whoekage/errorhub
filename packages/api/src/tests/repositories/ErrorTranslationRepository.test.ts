import { describe, it, expect, beforeEach, beforeAll, afterAll } from 'vitest';
import { DataSource, Repository } from 'typeorm';
import { ErrorTranslationRepository } from '@/db/repositories/ErrorTranslationRepository';
import { ErrorCodeRepository } from '@/db/repositories/ErrorCodeRepository';
import { ErrorTranslationEntity } from '@/db/entities/ErrorTranslationEntity';
import { ErrorCodeEntity } from '@/db/entities/ErrorCodeEntity';
import { ErrorCategoryEntity } from '@/db/entities/ErrorCategoryEntity';

// Setup in-memory database for tests
const testDataSource = new DataSource({
  type: 'sqlite',
  database: ':memory:',
  entities: [ErrorCodeEntity, ErrorCategoryEntity, ErrorTranslationEntity],
  synchronize: true,
  logging: false
});

describe('ErrorTranslationRepository', () => {
  let translationRepository: ErrorTranslationRepository;
  let errorCodeRepository: ErrorCodeRepository;
  let errorCodeEntity: ErrorCodeEntity;
  
  // Connect to the in-memory database before all tests
  beforeAll(async () => {
    await testDataSource.initialize();
    console.log('Test database initialized with in-memory SQLite');
  });

  // Close the database connection after all tests
  afterAll(async () => {
    if (testDataSource.isInitialized) {
      await testDataSource.destroy();
      console.log('Test database connection closed');
    }
  });

  // Setup fresh repositories and clear the database before each test
  beforeEach(async () => {
    translationRepository = new ErrorTranslationRepository(testDataSource);
    errorCodeRepository = new ErrorCodeRepository(testDataSource);
    
    // Clear tables before each test
    await testDataSource.getRepository(ErrorTranslationEntity).clear();
    await testDataSource.getRepository(ErrorCodeEntity).clear();
    await testDataSource.getRepository(ErrorCategoryEntity).clear();
    
    // Create a test error code for use in translation tests
    errorCodeEntity = await errorCodeRepository.create({
      code: `TEST.ERROR_${Date.now()}`,
      defaultMessage: 'Test error message'
    });
  });

  // Helper function to create a test translation
  async function createTestTranslation(data: Partial<ErrorTranslationEntity> = {}): Promise<ErrorTranslationEntity> {
    const defaultData = {
      language: 'en',
      message: 'Test translation message',
      ...data
    };
    
    return translationRepository.create(defaultData, errorCodeEntity);
  }

  describe('findAll', () => {
    it('should return all translations', async () => {
      // Arrange: Create test translations
      await createTestTranslation({ language: 'en' });
      await createTestTranslation({ language: 'fr' });
      
      // Act: Retrieve all translations
      const result = await translationRepository.findAll();
      
      // Assert: Verify all translations are returned
      expect(result).toHaveLength(2);
      expect(result.map(t => t.language)).toContain('en');
      expect(result.map(t => t.language)).toContain('fr');
    });

    it('should return empty array when no translations exist', async () => {
      // Act: Retrieve all translations from empty table
      const result = await translationRepository.findAll();
      
      // Assert: Verify empty array is returned
      expect(result).toEqual([]);
    });
  });

  describe('findByErrorCode', () => {
    it('should return translations for specific error code', async () => {
      // Arrange: Create test translations for our error code
      await createTestTranslation({ language: 'en' });
      await createTestTranslation({ language: 'fr' });
      
      // Act: Retrieve translations for the error code
      const result = await translationRepository.findByErrorCode(errorCodeEntity.code);
      
      // Assert: Verify translations are returned
      expect(result).toHaveLength(2);
      expect(result.map(t => t.language)).toContain('en');
      expect(result.map(t => t.language)).toContain('fr');
    });

    it('should return empty array when no translations exist for error code', async () => {
      // Act: Retrieve translations for non-existent error code
      const result = await translationRepository.findByErrorCode('NONEXISTENT.CODE');
      
      // Assert: Verify empty array is returned
      expect(result).toEqual([]);
    });
  });

  describe('findByErrorCodeAndLanguage', () => {
    it('should return translation for specific error code and language', async () => {
      // Arrange: Create test translations
      await createTestTranslation({ language: 'en', message: 'English message' });
      await createTestTranslation({ language: 'fr', message: 'French message' });
      
      // Act: Retrieve specific translation
      const result = await translationRepository.findByErrorCodeAndLanguage(errorCodeEntity.code, 'fr');
      
      // Assert: Verify correct translation is returned
      expect(result).not.toBeNull();
      expect(result?.language).toBe('fr');
      expect(result?.message).toBe('French message');
    });

    it('should return null when translation does not exist', async () => {
      // Act: Retrieve non-existent translation
      const result = await translationRepository.findByErrorCodeAndLanguage(errorCodeEntity.code, 'de');
      
      // Assert: Verify null is returned
      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create and save a new translation', async () => {
      // Arrange: Create test data
      const translationData = {
        language: 'es',
        message: 'Spanish message'
      };
      
      // Act: Create translation
      const result = await translationRepository.create(translationData, errorCodeEntity);
      
      // Assert: Verify translation is created correctly
      expect(result.id).toBeDefined();
      expect(result.language).toBe(translationData.language);
      expect(result.message).toBe(translationData.message);
      expect(result.errorCode).toBeDefined();
      expect(result.errorCode.code).toBe(errorCodeEntity.code);
      
      // Verify it was saved to the database
      const saved = await translationRepository.findByErrorCodeAndLanguage(errorCodeEntity.code, 'es');
      expect(saved).not.toBeNull();
      expect(saved?.id).toBe(result.id);
    });
  });

  describe('update', () => {
    it('should update an existing translation', async () => {
      // Arrange: Create test translation
      const translation = await createTestTranslation({ language: 'en', message: 'Original message' });
      const updateData = { message: 'Updated message' };
      
      // Act: Update the translation
      const result = await translationRepository.update(translation.id, updateData);
      
      // Assert: Verify translation is updated correctly
      expect(result).not.toBeNull();
      expect(result?.id).toBe(translation.id);
      expect(result?.language).toBe(translation.language);
      expect(result?.message).toBe(updateData.message);
      
      // Verify it was saved to the database
      const saved = await translationRepository.findByErrorCodeAndLanguage(errorCodeEntity.code, 'en');
      expect(saved?.message).toBe(updateData.message);
    });

    it('should return null when translation does not exist', async () => {
      // Act: Try to update non-existent translation
      const result = await translationRepository.update(9999, { message: 'Will not update' });
      
      // Assert: Verify null is returned
      expect(result).toBeNull();
    });
  });

  describe('delete', () => {
    it('should delete an existing translation', async () => {
      // Arrange: Create test translation
      const translation = await createTestTranslation({ language: 'en' });
      
      // Act: Delete the translation
      const result = await translationRepository.delete(translation.id);
      
      // Assert: Verify deletion is successful
      expect(result).toBe(true);
      
      // Verify it was deleted from the database
      const translations = await translationRepository.findByErrorCode(errorCodeEntity.code);
      expect(translations).toHaveLength(0);
    });

    it('should return false when translation does not exist', async () => {
      // Act: Try to delete non-existent translation
      const result = await translationRepository.delete(9999);
      
      // Assert: Verify false is returned
      expect(result).toBe(false);
    });
  });

  describe('deleteByErrorCode', () => {
    it('should delete all translations for an error code', async () => {
      // Arrange: Create multiple translations for the error code
      await createTestTranslation({ language: 'en' });
      await createTestTranslation({ language: 'fr' });
      await createTestTranslation({ language: 'es' });
      
      // Act: Delete all translations for the error code
      const result = await translationRepository.deleteByErrorCode(errorCodeEntity.code);
      
      // Assert: Verify deletion is successful
      expect(result).toBe(true);
      
      // Verify all translations were deleted
      const translations = await translationRepository.findByErrorCode(errorCodeEntity.code);
      expect(translations).toHaveLength(0);
    });

    it('should return false when no translations exist for error code', async () => {
      // Act: Try to delete translations for an error code with no translations
      const result = await translationRepository.deleteByErrorCode('NONEXISTENT.CODE');
      
      // Assert: Verify false is returned
      expect(result).toBe(false);
    });
  });
}); 