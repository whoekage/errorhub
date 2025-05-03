import { describe, it, expect, beforeEach, beforeAll, afterAll } from 'vitest';
import { DataSource, Repository } from 'typeorm';
import { ErrorCategoryRepository } from '@/db/repositories/ErrorCategoryRepository';
import { ErrorCategoryEntity } from '@/db/entities/ErrorCategoryEntity';
import { ErrorCodeEntity } from '@/db/entities/ErrorCodeEntity';
import { ErrorTranslationEntity } from '@/db/entities/ErrorTranslationEntity';

// Setup in-memory database for tests
const testDataSource = new DataSource({
  type: 'sqlite',
  database: ':memory:',
  entities: [ErrorCodeEntity, ErrorCategoryEntity, ErrorTranslationEntity],
  synchronize: true,
  logging: false
});

describe('ErrorCategoryRepository', () => {
  let repository: ErrorCategoryRepository;
  
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
    repository = new ErrorCategoryRepository(testDataSource);
    
    // Clear tables before each test
    await testDataSource.getRepository(ErrorCategoryEntity).clear();
  });

  // Helper function to create a test category
  async function createTestCategory(data: Partial<ErrorCategoryEntity> = {}): Promise<ErrorCategoryEntity> {
    const defaultData = {
      name: `Test Category ${Date.now()}`,
      description: 'Test category description',
      ...data
    };
    
    return repository.create(defaultData);
  }

  describe('findAll', () => {
    it('should return all categories', async () => {
      // Arrange: Create test categories
      const category1 = await createTestCategory({ name: 'Test Category 1' });
      const category2 = await createTestCategory({ name: 'Test Category 2' });
      
      // Act: Retrieve all categories
      const result = await repository.findAll();
      
      // Assert: Verify all categories are returned
      expect(result).toHaveLength(2);
      expect(result.map(c => c.name)).toContain('Test Category 1');
      expect(result.map(c => c.name)).toContain('Test Category 2');
    });

    it('should return empty array when no categories exist', async () => {
      // Act: Retrieve all categories from empty table
      const result = await repository.findAll();
      
      // Assert: Verify empty array is returned
      expect(result).toEqual([]);
    });
  });

  describe('findById', () => {
    it('should return category when it exists', async () => {
      // Arrange: Create test category
      const testCategory = await createTestCategory({ name: 'Find By ID Category' });
      
      // Act: Retrieve the category
      const result = await repository.findById(testCategory.id);
      
      // Assert: Verify correct category is returned
      expect(result).not.toBeNull();
      expect(result?.id).toBe(testCategory.id);
      expect(result?.name).toBe('Find By ID Category');
    });

    it('should return null when category does not exist', async () => {
      // Act: Try to retrieve non-existent category
      const result = await repository.findById(9999);
      
      // Assert: Verify null is returned
      expect(result).toBeNull();
    });
  });

  describe('findByName', () => {
    it('should return category when it exists', async () => {
      // Arrange: Create test category
      const testName = 'Unique Category Name';
      await createTestCategory({ name: testName });
      
      // Act: Retrieve the category
      const result = await repository.findByName(testName);
      
      // Assert: Verify correct category is returned
      expect(result).not.toBeNull();
      expect(result?.name).toBe(testName);
    });

    it('should return null when category does not exist', async () => {
      // Act: Try to retrieve non-existent category
      const result = await repository.findByName('Nonexistent Category');
      
      // Assert: Verify null is returned
      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create and save a new category', async () => {
      // Arrange: Create test data
      const categoryData = {
        name: 'New Test Category',
        description: 'Test create description'
      };
      
      // Act: Create category
      const result = await repository.create(categoryData);
      
      // Assert: Verify category is created correctly
      expect(result.id).toBeDefined();
      expect(result.name).toBe(categoryData.name);
      expect(result.description).toBe(categoryData.description);
      
      // Verify it was saved to the database
      const saved = await repository.findById(result.id);
      expect(saved).not.toBeNull();
      expect(saved?.id).toBe(result.id);
    });
  });

  describe('update', () => {
    it('should update an existing category', async () => {
      // Arrange: Create test category
      const category = await createTestCategory({ name: 'Update Test Category' });
      const updateData = { description: 'Updated description' };
      
      // Act: Update the category
      const result = await repository.update(category.id, updateData);
      
      // Assert: Verify category is updated correctly
      expect(result).not.toBeNull();
      expect(result?.id).toBe(category.id);
      expect(result?.name).toBe(category.name);
      expect(result?.description).toBe(updateData.description);
      
      // Verify it was saved to the database
      const saved = await repository.findById(category.id);
      expect(saved?.description).toBe(updateData.description);
    });

    it('should return null when category does not exist', async () => {
      // Act: Try to update non-existent category
      const result = await repository.update(9999, { description: 'Will not update' });
      
      // Assert: Verify null is returned
      expect(result).toBeNull();
    });

    it('should update multiple fields', async () => {
      // Arrange: Create test category
      const category = await createTestCategory();
      
      const updateData = {
        name: 'Updated Category Name',
        description: 'Updated description'
      };
      
      // Act: Update multiple fields
      const result = await repository.update(category.id, updateData);
      
      // Assert: Verify all fields are updated
      expect(result).not.toBeNull();
      expect(result?.name).toBe(updateData.name);
      expect(result?.description).toBe(updateData.description);
      
      // Verify it was saved to the database
      const saved = await repository.findById(category.id);
      expect(saved?.name).toBe(updateData.name);
      expect(saved?.description).toBe(updateData.description);
    });
  });

  describe('delete', () => {
    it('should delete an existing category', async () => {
      // Arrange: Create test category
      const category = await createTestCategory({ name: 'Delete Test Category' });
      
      // Act: Delete the category
      const result = await repository.delete(category.id);
      
      // Assert: Verify deletion is successful
      expect(result).toBe(true);
      
      // Verify it was deleted from the database
      const deleted = await repository.findById(category.id);
      expect(deleted).toBeNull();
    });

    it('should return false when category does not exist', async () => {
      // Act: Try to delete non-existent category
      const result = await repository.delete(9999);
      
      // Assert: Verify false is returned
      expect(result).toBe(false);
    });
  });
}); 