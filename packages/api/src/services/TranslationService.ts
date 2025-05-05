// TranslationService.ts
import { DataSource, Repository } from 'typeorm';
import { ErrorTranslationEntity, ErrorCodeEntity } from '@/db';
import { BaseListService } from './BaseListService';
import { Logger } from 'pino';
import pino from 'pino';
// Corrected DTO import and using placeholders for errors
import { UpsertTranslationRequest } from '@/dto/translations/upsert.dto'; // Use existing DTO
declare class ServiceError extends Error { constructor(message: string, options?: { cause: unknown }); }
declare class ResourceNotFoundError extends Error { constructor(message: string); }

/**
 * Service for managing error translations, extending BaseListService for list operations.
 */
export class TranslationService extends BaseListService<ErrorTranslationEntity> {
  private errorCodeRepository: Repository<ErrorCodeEntity>;
  private logger: Logger;

  constructor(dataSource: DataSource) {
    super(dataSource, ErrorTranslationEntity);
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
      return this.repository.find({ 
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
      return this.repository.find({ where: { language } });
    } catch (error) {
      this.logger.error({ error, language }, 'Failed to get translations by language');
      throw new ServiceError('Failed to retrieve translations', { cause: error });
    }
  }
  
  /**
   * Create or update a translation (Upsert) - Adapting existing method logic
   */
  async upsertTranslation(data: UpsertTranslationRequest): Promise<ErrorTranslationEntity> {
    // Use the existing upsert method which expects UpsertTranslationRequest
    return this.upsert(data);
  }
  
  // Keep the original upsert method (adapting parameter name)
   async upsert(data: UpsertTranslationRequest): Promise<ErrorTranslationEntity> {
     const { errorCode: code, language, message } = data; // Use errorCode from DTO, assign to 'code' locally
     return this.dataSource.transaction(async (entityManager) => {
       const errorCodeEntity = await entityManager.findOne(ErrorCodeEntity, {
         where: { code } // Use the local 'code' variable
       });

       if (!errorCodeEntity) {
         throw new ResourceNotFoundError(`Error code not found: ${code}`);
       }

       let result: ErrorTranslationEntity;

       const existingTranslation = await entityManager.findOne(ErrorTranslationEntity, {
         where: {
           errorCode: {
             id: errorCodeEntity.id
           },
           language: language // Use language directly from DTO
         }
       });

       if (existingTranslation) {
         existingTranslation.message = message; // Use message directly from DTO
         result = await entityManager.save(existingTranslation);
       } else {
         const newTranslation = entityManager.create(ErrorTranslationEntity, {
           errorCode: errorCodeEntity, // Pass the full entity
           language: language,
           message: message
         });
         result = await entityManager.save(newTranslation);
       }
       return result;
     });
   }

  /**
   * Delete a specific translation - using existing method
   */
  async deleteTranslation(id: number): Promise<boolean> {
     const response = await this.delete(id);
     return response.success;
  }

  // Keep the original delete method
  async delete(id: number): Promise<{ success: boolean }> {
    const translation = await this.repository.findOne({ 
      where: { id }
    });

    if (!translation) {
      throw new ResourceNotFoundError(`Translation not found: ${id}`);
    }   
    const result = await this.repository.delete(id);
    return { success: result.affected !== null && result.affected !== undefined && result.affected > 0 };
  }

  // Keep deleteAllByErrorCode if needed
  async deleteAllByErrorCode(code: string): Promise<{ success: boolean }> {
    // Use 'code' instead of 'errorCode' which might be the object
    const result = await this.repository.delete({ errorCode: { code: code } });
    return { success: result.affected !== null && result.affected !== undefined && result.affected > 0 };
  }
}