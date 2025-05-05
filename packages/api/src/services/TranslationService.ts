// TranslationService.ts
import { DataSource } from 'typeorm';
import { ErrorTranslationEntity, ErrorCodeEntity } from '@/db';
import { ResourceNotFoundError } from '@/utils/errors';
import { UpsertTranslationRequest, UpsertTranslationResponse } from '@/dto/translations/upsert.dto';
import {  DeleteTranslationResponse } from '@/dto/translations/delete.dto';
import { Repository } from 'typeorm';
export class TranslationService {
  private errorCodeRepository: Repository<ErrorCodeEntity>;
  private translationRepository: Repository<ErrorTranslationEntity>;

  constructor(
    private readonly dataSource: DataSource
  ) {
    this.errorCodeRepository = this.dataSource.getRepository(ErrorCodeEntity);
    this.translationRepository = this.dataSource.getRepository(ErrorTranslationEntity);
  }

  /**
   * Create or update a translation
   */

  async upsert(data: UpsertTranslationRequest): Promise<UpsertTranslationResponse> {
    return this.dataSource.transaction(async () => {
      
      // 1. Check if error code exists
      const errorCode = await this.errorCodeRepository.findOne({ 
        where: { 
          code: data.errorCode
        }
      });

      if (!errorCode) {
        throw new ResourceNotFoundError(`Error code not found: ${data.errorCode}`);
      }

      // 2. Check if translation exists
      const existingTranslation = await this.translationRepository.findOne({
        where: {
          errorCode: {
            code: data.errorCode
          },
          language: data.language
        }
      });
      
      
      let result: ErrorTranslationEntity;
      
      if (existingTranslation) {
        // Update existing translation
        existingTranslation.message = data.message;
        result = await this.translationRepository.save(existingTranslation);
      } else {
        // Create new translation
        const newTranslation = this.translationRepository.create({
          errorCode,
          language: data.language,
          message: data.message
        });
        
        result = await this.translationRepository.save(newTranslation);
      }
      
      return {
        id: result.id,
        errorCode: data.errorCode,
        language: result.language,
        message: result.message,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt
      };
    });
  }

  /**
   * Delete a translation
   */
  async delete(id: number): Promise<DeleteTranslationResponse> {
    const translation = await this.translationRepository.findOne({ 
      where: { 
        id
      }
    });
    if (!translation) {
      throw new ResourceNotFoundError(`Translation not found: ${id}`);
    }   
    const result = await this.translationRepository.delete(id);
    return { success: result.affected !== 0 && result.raw.affectedRows > 0 };
  }
  /**
   * Delete all translations by error code
   */
  async deleteAllByErrorCode(errorCode: string): Promise<DeleteTranslationResponse> {
    const result = await this.translationRepository.delete({ errorCode: { code: errorCode } });
    return { success: result.affected !== 0 && result.raw.affectedRows > 0 };
  }


}