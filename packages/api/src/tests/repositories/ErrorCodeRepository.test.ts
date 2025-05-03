import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import { DataSource, Repository } from 'typeorm';
import { ErrorCodeRepository } from '@/db/repositories/ErrorCodeRepository';
import { ErrorCodeEntity } from '@/db/entities/ErrorCodeEntity';
import { ErrorCategoryEntity } from '@/db/entities/ErrorCategoryEntity';
import { ErrorTranslationEntity } from '@/db/entities/ErrorTranslationEntity';
// Setup in-memory database for tests
const testDataSource = new DataSource({
  type: 'sqlite',
  database: ':memory:',
  entities: [ErrorCodeEntity, ErrorCategoryEntity, ErrorTranslationEntity],
  synchronize: true,
  logging: false
});

describe('ErrorCodeRepository', () => {
  let repository: ErrorCodeRepository;
  let categoryRepository: Repository<ErrorCategoryEntity>;
  
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

  // Setup a fresh repository and clear the database before each test
  beforeEach(async () => {
    repository = new ErrorCodeRepository(testDataSource);
    categoryRepository = testDataSource.getRepository(ErrorCategoryEntity);
    
    // Clear tables before each test
    await testDataSource.getRepository(ErrorCodeEntity).clear();
    await testDataSource.getRepository(ErrorCategoryEntity).clear();
  });

  // Helper function to create a test category
  async function createTestCategory(data: Partial<ErrorCategoryEntity> = {}): Promise<ErrorCategoryEntity> {
    const defaultData = {
      name: `Test Category ${Date.now()}`,
      description: 'Test category description',
      ...data
    };
    
    return categoryRepository.save(categoryRepository.create(defaultData));
  }

  // Helper function to create a test error code
  async function createTestErrorCode(data: Partial<ErrorCodeEntity> = {}): Promise<ErrorCodeEntity> {
    // Create category if needed
    let categoryId = data.categoryId;
    if (!categoryId) {
      const category = await createTestCategory();
      categoryId = category.id;
    }
    
    const defaultData = {
      code: `TEST.ERROR_${Date.now()}`,
      defaultMessage: 'Test error message',
      categoryId,
      ...data
    };
    
    return repository.create(defaultData);
  }

  describe('findAll', () => {
    it('should return all error codes', async () => {
      // Arrange: Create test error codes
      const errorCode1 = await createTestErrorCode({ code: 'TEST.FIND_ALL_1' });
      const errorCode2 = await createTestErrorCode({ code: 'TEST.FIND_ALL_2' });
      
      // Act: Retrieve all error codes
      const result = await repository.findAll();
      
      // Assert: Verify all error codes are returned
      expect(result).toHaveLength(2);
      expect(result.map(e => e.code)).toContain('TEST.FIND_ALL_1');
      expect(result.map(e => e.code)).toContain('TEST.FIND_ALL_2');
    });

    it('should return empty array when no error codes exist', async () => {
      // Act: Retrieve all error codes from empty table
      const result = await repository.findAll();
      
      // Assert: Verify empty array is returned
      expect(result).toEqual([]);
    });

    it('should respect find options with relations', async () => {
      // Arrange: Create test error code
      await createTestErrorCode();
      
      // Act: Retrieve all error codes with category relation
      const result = await repository.findAll({ relations: ['category'] });
      
      // Assert: Verify category is loaded
      expect(result[0].category).toBeDefined();
      expect(result[0].category.name).toContain('Test Category');
    });
  });

  describe('findByCode', () => {
    it('should return error code when it exists', async () => {
      // Arrange: Create test error code
      const testCode = 'TEST.FIND_BY_CODE';
      const errorCode = await createTestErrorCode({ code: testCode });
      
      // Act: Retrieve the error code
      const result = await repository.findByCode(testCode);
      
      // Assert: Verify correct error code is returned
      expect(result).not.toBeNull();
      expect(result?.code).toBe(testCode);
      expect(result?.defaultMessage).toBe(errorCode.defaultMessage);
    });

    it('should return null when error code does not exist', async () => {
      // Act: Try to retrieve non-existent error code
      const result = await repository.findByCode('NONEXISTENT.CODE');
      
      // Assert: Verify null is returned
      expect(result).toBeNull();
    });

    it('should respect find options with relations', async () => {
      // Arrange: Create test error code
      const testCode = 'TEST.FIND_WITH_RELATIONS';
      await createTestErrorCode({ code: testCode });
      
      // Act: Retrieve the error code with category relation
      const result = await repository.findByCode(testCode, { relations: ['category'] });
      
      // Assert: Verify category is loaded
      expect(result?.category).toBeDefined();
      expect(result?.category.name).toContain('Test Category');
    });
  });

  describe('findByCategoryId', () => {
    it('should return error codes for specific category', async () => {
      // Arrange: Create categories and error codes
      const category1 = await createTestCategory({ name: 'Category 1' });
      const category2 = await createTestCategory({ name: 'Category 2' });
      
      await createTestErrorCode({ code: 'TEST.CATEGORY_1_ERROR_1', categoryId: category1.id });
      await createTestErrorCode({ code: 'TEST.CATEGORY_1_ERROR_2', categoryId: category1.id });
      await createTestErrorCode({ code: 'TEST.CATEGORY_2_ERROR_1', categoryId: category2.id });
      
      // Act: Retrieve error codes for category 1
      const result = await repository.findByCategoryId(category1.id);
      
      // Assert: Verify only category 1 error codes are returned
      expect(result).toHaveLength(2);
      expect(result.map(e => e.code)).toContain('TEST.CATEGORY_1_ERROR_1');
      expect(result.map(e => e.code)).toContain('TEST.CATEGORY_1_ERROR_2');
      expect(result.map(e => e.code)).not.toContain('TEST.CATEGORY_2_ERROR_1');
    });

    it('should return empty array when no error codes exist for category', async () => {
      // Arrange: Create category without error codes
      const category = await createTestCategory();
      
      // Act: Retrieve error codes for the category
      const result = await repository.findByCategoryId(category.id);
      
      // Assert: Verify empty array is returned
      expect(result).toEqual([]);
    });

    it('should respect find options with relations', async () => {
      // Arrange: Create category and error code
      const category = await createTestCategory();
      await createTestErrorCode({ categoryId: category.id });
      
      // Act: Retrieve error codes with category relation
      const result = await repository.findByCategoryId(category.id, { relations: ['category'] });
      
      // Assert: Verify category is loaded
      expect(result[0].category).toBeDefined();
      expect(result[0].category.id).toBe(category.id);
    });
  });

  describe('create', () => {
    it('should create and save a new error code', async () => {
      // Arrange: Create test data
      const category = await createTestCategory();
      const errorCodeData = {
        code: 'TEST.CREATE',
        defaultMessage: 'Test create message',
        categoryId: category.id
      };
      
      // Act: Create error code
      const result = await repository.create(errorCodeData);
      
      // Assert: Verify error code is created correctly
      expect(result.id).toBeDefined();
      expect(result.code).toBe(errorCodeData.code);
      expect(result.defaultMessage).toBe(errorCodeData.defaultMessage);
      expect(result.categoryId).toBe(category.id);
      
      // Verify it was saved to the database
      const saved = await repository.findByCode(errorCodeData.code);
      expect(saved).not.toBeNull();
      expect(saved?.id).toBe(result.id);
    });

    it('should create error code with minimal data', async () => {
      // Arrange: Create minimal test data
      const errorCodeData = {
        code: 'TEST.MINIMAL',
        defaultMessage: 'Minimal data'
      };
      
      // Act: Create error code
      const result = await repository.create(errorCodeData);
      
      // Assert: Verify error code is created correctly
      expect(result.id).toBeDefined();
      expect(result.code).toBe(errorCodeData.code);
      expect(result.defaultMessage).toBe(errorCodeData.defaultMessage);
      expect(result.categoryId).toBeNull();
    });
  });

  describe('update', () => {
    it('should update an existing error code', async () => {
      // Arrange: Create test error code
      const errorCode = await createTestErrorCode({ code: 'TEST.UPDATE' });
      const updateData = { defaultMessage: 'Updated message' };
      
      // Act: Update the error code
      const result = await repository.update(errorCode.code, updateData);
      
      // Assert: Verify error code is updated correctly
      expect(result).not.toBeNull();
      expect(result?.code).toBe(errorCode.code);
      expect(result?.defaultMessage).toBe(updateData.defaultMessage);
      expect(result?.id).toBe(errorCode.id);
      
      // Verify it was saved to the database
      const saved = await repository.findByCode(errorCode.code);
      expect(saved?.defaultMessage).toBe(updateData.defaultMessage);
    });

    it('should return null when error code does not exist', async () => {
      // Act: Try to update non-existent error code
      const result = await repository.update('NONEXISTENT.CODE', { defaultMessage: 'Will not update' });
      
      // Assert: Verify null is returned
      expect(result).toBeNull();
    });

    it('should update multiple fields', async () => {
      // Arrange: Create test error code and category
      const errorCode = await createTestErrorCode({ code: 'TEST.MULTI_UPDATE' });
      const newCategory = await createTestCategory({ name: 'New Category' });
      
      const updateData = {
        defaultMessage: 'Updated message',
        categoryId: newCategory.id
      };
      
      // Act: Update multiple fields
      const result = await repository.update(errorCode.code, updateData);
      
      // Assert: Verify all fields are updated
      expect(result).not.toBeNull();
      expect(result?.defaultMessage).toBe(updateData.defaultMessage);
      expect(result?.categoryId).toBe(newCategory.id);
      
      // Verify it was saved to the database
      const saved = await repository.findByCode(errorCode.code);
      expect(saved?.defaultMessage).toBe(updateData.defaultMessage);
      expect(saved?.categoryId).toBe(newCategory.id);
    });

    it('should maintain transaction integrity', async () => {
      // Arrange: Create test error code
      const errorCode = await createTestErrorCode({ code: 'TEST.TRANSACTION' });
      
      // Create invalid update data that should fail (forcing a foreign key constraint error)
      const updateData = {
        categoryId: 9999 // Non-existent category ID
      };
      
      // Act & Assert: Update should fail but not corrupt the database
      await expect(repository.update(errorCode.code, updateData)).rejects.toThrow();
      
      // Verify original data is intact
      const saved = await repository.findByCode(errorCode.code);
      expect(saved).not.toBeNull();
      expect(saved?.categoryId).toBe(errorCode.categoryId); // Original categoryId should remain
    });
  });

  describe('delete', () => {
    it('should delete an existing error code', async () => {
      // Arrange: Create test error code
      const errorCode = await createTestErrorCode({ code: 'TEST.DELETE' });
      
      // Act: Delete the error code
      const result = await repository.delete(errorCode.code);
      
      // Assert: Verify deletion is successful
      expect(result).toBe(true);
      
      // Verify it was deleted from the database
      const deleted = await repository.findByCode(errorCode.code);
      expect(deleted).toBeNull();
    });

    it('should return false when error code does not exist', async () => {
      // Act: Try to delete non-existent error code
      const result = await repository.delete('NONEXISTENT.CODE');
      
      // Assert: Verify false is returned
      expect(result).toBe(false);
    });
  });
});