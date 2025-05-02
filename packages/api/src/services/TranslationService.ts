import { ErrorTranslationRepository } from '../db/repositories/ErrorTranslationRepository';
import { ErrorTranslationEntity } from '../db/entities/ErrorTranslationEntity';

/**
 * Service for managing error translations
 */
export class TranslationService {
  constructor(
    private errorTranslationRepository: ErrorTranslationRepository
  ) {}

  /**
   * Get all translations for an error code
   * @param errorCode Error code
   */
  async getTranslationsForError(errorCode: string): Promise<ErrorTranslationEntity[]> {
    return this.errorTranslationRepository.findByErrorCode(errorCode);
  }

  /**
   * Get specific translation by error code and language
   * @param errorCode Error code
   * @param language Language code
   */
  async getTranslation(errorCode: string, language: string): Promise<ErrorTranslationEntity | null> {
    return this.errorTranslationRepository.findByErrorCodeAndLanguage(errorCode, language);
  }

  /**
   * Create or update a translation
   * @param data Translation data
   */
  async upsertTranslation(data: { 
    errorCode: string; 
    language: string; 
    message: string; 
    description?: string 
  }): Promise<ErrorTranslationEntity> {
    const existing = await this.errorTranslationRepository.findByErrorCodeAndLanguage(
      data.errorCode, 
      data.language
    );
    
    if (existing) {
      return this.errorTranslationRepository.update(existing.id, data);
    } else {
      return this.errorTranslationRepository.create(data);
    }
  }

  /**
   * Delete a translation
   * @param id Translation ID
   */
  async deleteTranslation(id: number): Promise<boolean> {
    return this.errorTranslationRepository.delete(id);
  }

  /**
   * Delete all translations for an error code
   * @param errorCode Error code
   */
  async deleteTranslationsForError(errorCode: string): Promise<boolean> {
    return this.errorTranslationRepository.deleteByErrorCode(errorCode);
  }
} 