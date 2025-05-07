// src/tests/utils/test-data.ts
import { testDataSource } from '../setup';
import { ErrorCodeEntity, ErrorCategoryEntity, ErrorTranslationEntity } from '@/db';

export class TestData {
  // Track categories to avoid unique constraint errors
  private static categoryCounter = 0;

  static async seedCategory(data: Partial<ErrorCategoryEntity> = {}): Promise<ErrorCategoryEntity> {
    const repository = testDataSource.getRepository(ErrorCategoryEntity);
    
    // Generate truly unique category name
    this.categoryCounter++;
    const uniqueTimestamp = Date.now();
    
    const defaultData = {
      name: `Test Category ${uniqueTimestamp}-${this.categoryCounter}`,
      description: 'Test category description',
      ...data
    };
    
    const category = repository.create(defaultData);
    return repository.save(category);
  }
  
  static async seedErrorCode(data: Partial<ErrorCodeEntity> = {}): Promise<ErrorCodeEntity> {
    const repository = testDataSource.getRepository(ErrorCodeEntity);
    
    // Create category if needed
    if (!data.categoryId && !data.category) {
      const category = await this.seedCategory();
      data.categoryId = category.id;
    }
    
    // Generate unique code to avoid clashes
    const timestamp = Date.now();
    const randomPart = Math.floor(Math.random() * 10000);
    
    const defaultData = {
      code: `TEST.ERROR_${timestamp}_${randomPart}`,
      defaultMessage: 'Test error message',
      ...data
    };
    
    const errorCode = repository.create(defaultData);
    return repository.save(errorCode);
  }

  static async seedTranslation(
    data: Partial<ErrorTranslationEntity & { errorCode?: string | ErrorCodeEntity }> = {}
  ): Promise<ErrorTranslationEntity> {
    const translationRepo = testDataSource.getRepository(ErrorTranslationEntity);
    const errorCodeRepo = testDataSource.getRepository(ErrorCodeEntity);

    // Determine provided errorCode input if any
    const errorCodeInput = data.errorCode;
    let errorCodeEntity: ErrorCodeEntity | undefined;

    if (typeof errorCodeInput === 'string') {
      errorCodeEntity = await errorCodeRepo.findOne({ where: { code: errorCodeInput } }) ?? undefined;
    } else if (errorCodeInput instanceof ErrorCodeEntity) {
      errorCodeEntity = errorCodeInput;
    }

    // Create new ErrorCodeEntity if not provided/found
    if (!errorCodeEntity) {
      errorCodeEntity = await this.seedErrorCode();
    }

    const defaultData: Partial<ErrorTranslationEntity> = {
      language: 'en',
      message: 'Test translation message',
      ...data,
      errorCode: errorCodeEntity,
    };

    const translation = translationRepo.create(defaultData as ErrorTranslationEntity);
    return translationRepo.save(translation);
  }
}