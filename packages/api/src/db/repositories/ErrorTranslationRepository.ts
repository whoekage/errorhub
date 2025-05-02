import { Repository, FindOptionsWhere } from 'typeorm';
import { ErrorTranslationEntity } from '../entities/ErrorTranslationEntity';
import { AppDataSource } from '../data-source';
import { CreateErrorTranslationDto, UpdateErrorTranslationDto } from '../../dto/error-translation.dto';
import { ErrorCodeEntity } from '../entities/ErrorCodeEntity';

export class ErrorTranslationRepository {
  private repository: Repository<ErrorTranslationEntity>;

  constructor() {
    this.repository = AppDataSource.getRepository(ErrorTranslationEntity);
  }

  /**
   * Find all translations
   * @param options Optional find options
   */
  async findAll(options: object = {}): Promise<ErrorTranslationEntity[]> {
    return this.repository.find(options);
  }

  /**
   * Find translations for a specific error code
   * @param errorCode The error code
   * @param options Optional find options
   */
  async findByErrorCode(errorCode: string, options: object = {}): Promise<ErrorTranslationEntity[]> {
    return this.repository.find({
      where: { errorCode: { code: errorCode } } as FindOptionsWhere<ErrorTranslationEntity>,
      ...options,
    });
  }

  /**
   * Find a specific translation by error code and language
   * @param errorCode The error code
   * @param language The language code
   * @param options Optional find options
   */
  async findByErrorCodeAndLanguage(
    errorCode: string,
    language: string,
    options: object = {}
  ): Promise<ErrorTranslationEntity | null> {
    return this.repository.findOne({
      where: { 
        errorCode: { code: errorCode },
        language 
      } as FindOptionsWhere<ErrorTranslationEntity>,
      ...options,
    });
  }

  /**
   * Create a new translation
   * @param data Translation data with errorCode as string
   * @param errorCodeEntity The associated error code entity
   */
  async create(
    data: CreateErrorTranslationDto, 
    errorCodeEntity: ErrorCodeEntity
  ): Promise<ErrorTranslationEntity> {
    const { errorCode, ...translationData } = data;
    
    const translation = this.repository.create({
      ...translationData,
      errorCode: errorCodeEntity
    });
    
    return this.repository.save(translation);
  }

  /**
   * Update an existing translation
   * @param id The translation id
   * @param data Updated translation data
   */
  async update(id: number, data: UpdateErrorTranslationDto): Promise<ErrorTranslationEntity | null> {
    const translation = await this.repository.findOne({ 
      where: { id } as FindOptionsWhere<ErrorTranslationEntity> 
    });
    
    if (!translation) {
      return null;
    }
    
    Object.assign(translation, data);
    return this.repository.save(translation);
  }

  /**
   * Delete a translation
   * @param id The translation id
   */
  async delete(id: number): Promise<boolean> {
    const result = await this.repository.delete(id);
    return result.affected !== null && result.affected !== undefined && result.affected > 0;
  }

  /**
   * Delete all translations for an error code
   * @param errorCode The error code
   */
  async deleteByErrorCode(errorCode: string): Promise<boolean> {
    const result = await this.repository.delete({ 
      errorCode: { code: errorCode } 
    } as FindOptionsWhere<ErrorTranslationEntity>);
    
    return result.affected !== null && result.affected !== undefined && result.affected > 0;
  }
} 