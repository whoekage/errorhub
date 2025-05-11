// TranslationService.ts
import { DataSource, Repository, EntityManager } from 'typeorm';
import { ErrorTranslationEntity, ErrorCodeEntity } from '@/db';
import { offsetPaginate } from '@/utils/pagination';
import { Logger } from 'pino';
import pino from 'pino';
import { ResourceNotFoundError, ServiceError, ResourceConflictError } from '@/utils/errors';
// Corrected DTO import and using placeholders for errors
// import { UpsertTranslationRequest } from '@/dto/translations/upsert.dto'; // Use existing DTO
// Assuming a DTO for creation might look like this. 
// It should be defined properly in the dto/translations folder.
interface CreateTranslationServiceDto {
  errorCodeId: number; // Or pass the full ErrorCodeEntity for easier relation assignment
  // errorCode: ErrorCodeEntity; // Alternative: pass the full entity
  language: string;
  message: string;
}

// Placeholder DTO for update, to be defined properly
interface UpdateTranslationServiceDto {
  message?: string;
  // language and errorCodeId are typically not updated, but a new entry is made or old one deleted.
}

// DTO for individual translation item in bulk creation
interface BulkCreateTranslationItemDto {
  language: string;
  message: string;
}

// Interface for potential database error structure
interface DatabaseError extends Error { // Added interface
  code?: string;
  constraint?: string;
}

/**
 * Service for managing error translations, extending BaseListService for list operations.
 */
export class TranslationService {
  private dataSource: DataSource;
  private errorTranslationRepository: Repository<ErrorTranslationEntity>;
  private errorCodeRepository: Repository<ErrorCodeEntity>;
  private logger: Logger;

  constructor(dataSource: DataSource) {
    this.dataSource = dataSource;
    this.errorTranslationRepository = this.dataSource.getRepository(ErrorTranslationEntity);
    this.errorCodeRepository = this.dataSource.getRepository(ErrorCodeEntity);
    this.logger = pino({ name: 'translation-service' });
  }

  // --- Implementation of BaseListService abstract methods --- 

  protected getAllowedFields(): (keyof ErrorTranslationEntity)[] {
    return [
      'id',
      'errorCode', // Use the relation object itself for filtering/sorting if needed
      'language',
      'message',
      'createdAt',
      'updatedAt'
    ];
  }

  protected getSearchableFields(): (keyof ErrorTranslationEntity)[] {
    return ['language', 'message'];
  }

  protected getAllowedRelations(): string[] {
    return ['errorCode']; 
  }

  // --- Existing specialized methods --- 

  /**
   * Get all translations for a specific error code
   */
  async getTranslationsForError(code: string): Promise<ErrorTranslationEntity[]> {
    try {
      const errorCode = await this.errorCodeRepository.findOneBy({ code });
      if (!errorCode) {
        throw new ResourceNotFoundError(`Error code not found: ${code}`);
      }
      // Correct where clause using the relation ID
      return this.errorTranslationRepository.find({ 
        where: { errorCode: { id: errorCode.id } }
      });
    } catch (error) {
      if (error instanceof ResourceNotFoundError) {
        throw error;
      }
      this.logger.error({ error, code }, 'Failed to get translations for error code');
      throw new ServiceError('Failed to retrieve translations', { cause: error });
    }
  }

  /**
   * Get all translations for a specific language
   */
  async getTranslationsByLanguage(language: string): Promise<ErrorTranslationEntity[]> {
     try {
      return this.errorTranslationRepository.find({ where: { language } });
    } catch (error) {
      this.logger.error({ error, language }, 'Failed to get translations by language');
      throw new ServiceError('Failed to retrieve translations', { cause: error });
    }
  }
  
  /**
   * Retrieves translations list using keyset pagination.
   */
  async getAll(query: Record<string, unknown>, baseUrl: string) {
    const result = await offsetPaginate<ErrorTranslationEntity>(this.errorTranslationRepository, {
      ...query,
      alias: 'translation',
      searchableFields: this.getSearchableFields(),
      baseUrl
    });
    return result;
  }

  // --- Write methods (requiring EntityManager, called by UseCases) ---

  /**
   * Creates a new ErrorTranslationEntity record.
   * Expects errorCodeId to be valid and exist (validated by UseCase).
   */
  async create(entityManager: EntityManager, data: CreateTranslationServiceDto): Promise<ErrorTranslationEntity> {
    const { errorCodeId, language, message } = data;
    this.logger.info({ errorCodeId, language, messageLength: message.length }, "create translation called with EntityManager.");

    const translationRepo = entityManager.getRepository(ErrorTranslationEntity);
    
    // The UseCase should ensure ErrorCodeEntity for errorCodeId exists.
    // For creating the relation, we need either the ID or the entity itself.
    // If ErrorTranslationEntity has `errorCodeId` as a column:
    // const newTranslation = translationRepo.create({ errorCodeId, language, message });
    // If ErrorTranslationEntity has `errorCode: ErrorCodeEntity` relation:
    const errorCodeEntity = await entityManager.getRepository(ErrorCodeEntity).findOneBy({ id: errorCodeId });
    if (!errorCodeEntity) {
        // This check is a safeguard; UseCase should ideally prevent this.
        throw new ResourceNotFoundError(`Error code with ID ${errorCodeId} not found, cannot create translation.`);
    }

    // Check if this specific translation already exists to prevent duplicates if there's a unique constraint
    // This logic might be better in the UseCase if it decides to update instead of fail
    const existingTranslation = await translationRepo.findOne({
        where: { errorCode: { id: errorCodeId }, language }
    });
    if (existingTranslation) {
        this.logger.warn({ errorCodeId, language }, "Translation already exists. Consider using an update/upsert method or ensuring unique data from UseCase.");
        // Depending on desired behavior, either throw an error or allow update (current is create-only)
        throw new ServiceError('Translation for this error code and language already exists.', { statusCode: 409 }); // 409 Conflict
    }

    const newTranslation = translationRepo.create({ 
      errorCode: errorCodeEntity, // Assign the full ErrorCodeEntity instance
      language,
      message 
    });
    
    try {
      return await translationRepo.save(newTranslation);
    } catch (error) {
      this.logger.error({ error, data }, "Failed to save new translation.");
      throw new ServiceError('Failed to save new translation.', { cause: error });
    }
  }

  /**
   * Updates an existing ErrorTranslationEntity record.
   * Requires the ID of the translation to update.
   */
  async update(entityManager: EntityManager, translationId: number, data: UpdateTranslationServiceDto): Promise<ErrorTranslationEntity> {
    this.logger.info({ translationId, data }, "update translation called with EntityManager.");
    const translationRepo = entityManager.getRepository(ErrorTranslationEntity);

    const translation = await translationRepo.findOneBy({ id: translationId });
    if (!translation) {
      throw new ResourceNotFoundError(`Translation with ID ${translationId} not found.`);
    }

    if (data.message !== undefined) {
      translation.message = data.message;
    }
    // Language and errorCodeId are typically not changed for an existing translation record.
    // If they need to change, it's usually a delete + create new.

    try {
      return await translationRepo.save(translation);
    } catch (error) {
      this.logger.error({ error, translationId, data }, "Failed to update translation.");
      throw new ServiceError('Failed to update translation.', { cause: error });
    }
  }

  /**
   * Deletes an ErrorTranslationEntity record by its ID.
   */
  async delete(entityManager: EntityManager, translationId: number): Promise<boolean> {
    this.logger.info({ translationId }, "delete translation called with EntityManager.");
    const translationRepo = entityManager.getRepository(ErrorTranslationEntity);
    const result = await translationRepo.delete({ id: translationId });
    if (result.affected === 0) {
      throw new ResourceNotFoundError(`Translation with ID ${translationId} not found for deletion.`);
    }
    return true;
  }

  /**
   * Creates multiple ErrorTranslationEntity records in bulk for a given error code.
   * Skips creating a translation if one for the same language already exists for the error code.
   */
  async createBulk(
    entityManager: EntityManager, 
    errorCodeId: number, 
    translations: BulkCreateTranslationItemDto[]
  ): Promise<ErrorTranslationEntity[]> {
    this.logger.info({ errorCodeId, translationsCount: translations.length }, "createBulk translations called with EntityManager.");

    const translationRepo = entityManager.getRepository(ErrorTranslationEntity);
    const errorCodeRepo = entityManager.getRepository(ErrorCodeEntity); // To fetch the ErrorCodeEntity instance

    // 1. Fetch the ErrorCodeEntity to associate with translations
    const errorCodeEntity = await errorCodeRepo.findOneBy({ id: errorCodeId });
    if (!errorCodeEntity) {
      this.logger.error({ errorCodeId }, "Error code not found, cannot create bulk translations.");
      throw new ResourceNotFoundError(`Error code with ID ${errorCodeId} not found, cannot create bulk translations.`);
    }

    const newTranslationsToSave: Partial<ErrorTranslationEntity>[] = [];
    const createdTranslations: ErrorTranslationEntity[] = [];

    for (const item of translations) {
      if (!item.language || !item.message || item.message.trim() === '') {
        this.logger.warn({ errorCodeId, item }, "Skipping translation due to empty language or message.");
        continue;
      }

      // 2. Check if this specific translation already exists
      const existingTranslation = await translationRepo.findOne({
        where: { errorCode: { id: errorCodeId }, language: item.language }
      });

      if (existingTranslation) {
        this.logger.warn({ errorCodeId, language: item.language }, "Translation already exists for this language. Skipping in bulk create.");
        // Potentially add to a list of skipped/updated items if needed to return more detailed info
        continue;
      } else {
        newTranslationsToSave.push({
          errorCode: errorCodeEntity, // Associate with the fetched ErrorCodeEntity instance
          language: item.language,
          message: item.message
        });
      }
    }

    // 3. Save all new translations in one go if any are to be saved
    if (newTranslationsToSave.length > 0) {
      this.logger.info({ errorCodeId, count: newTranslationsToSave.length }, "Saving new translations in bulk.");
      try {
        const savedEntities = await translationRepo.save(newTranslationsToSave);
        createdTranslations.push(...savedEntities);
        this.logger.info({ errorCodeId, count: savedEntities.length }, "Successfully saved translations in bulk.");
      } catch (error) {
        this.logger.error({ error, errorCodeId }, "Failed to save translations in bulk.");
        const dbError = error as DatabaseError; // Using the defined interface for type assertion
        if (dbError.code === 'ER_DUP_ENTRY' || dbError.constraint === 'unique_translation_constraint_name') { 
            throw new ResourceConflictError('A conflict occurred while saving translations. Some might already exist.');
        }
        throw new ServiceError('Failed to save new translations in bulk.', { cause: error });
      }
    }
    
    return createdTranslations; // Return only the actually created translations
  }

  /**
   * Deletes all ErrorTranslationEntity records for a specific error code ID.
   * Uses the provided EntityManager to ensure operation within a transaction.
   */
  async deleteAllByErrorCodeId(entityManager: EntityManager, errorCodeId: number): Promise<void> {
    this.logger.info({ errorCodeId }, "deleteAllByErrorCodeId called with EntityManager.");
    const translationRepo = entityManager.getRepository(ErrorTranslationEntity);
    
    // Find all translations associated with this errorCodeId via the relation
    const translationsToDelete = await translationRepo.find({
      where: { errorCode: { id: errorCodeId } } // Assumes 'errorCode' is a relation to ErrorCodeEntity
    });

    if (translationsToDelete.length > 0) {
      await translationRepo.remove(translationsToDelete);
      this.logger.info({ errorCodeId, count: translationsToDelete.length }, "Successfully deleted translations by errorCodeId.");
    } else {
      this.logger.info({ errorCodeId }, "No translations found to delete for this errorCodeId.");
    }
  }

  // --- Deprecated/Old Methods (To be removed or refactored if still used elsewhere) ---
  // ... (if any)
}