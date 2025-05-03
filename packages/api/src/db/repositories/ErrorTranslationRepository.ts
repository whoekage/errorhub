import { Repository, FindOptionsWhere, DataSource, FindManyOptions, FindOneOptions, EntityManager } from 'typeorm';
import { ErrorTranslationEntity } from '@/db/entities/ErrorTranslationEntity';
import { ErrorCodeEntity } from '@/db/entities/ErrorCodeEntity';

export interface IErrorTranslationRepository {
  findAll(options?: FindManyOptions<ErrorTranslationEntity>): Promise<ErrorTranslationEntity[]>;
  findByErrorCode(errorCode: string, options?: FindManyOptions<ErrorTranslationEntity>): Promise<ErrorTranslationEntity[]>;
  findByErrorCodeAndLanguage(errorCode: string, language: string, options?: FindOneOptions<ErrorTranslationEntity>): Promise<ErrorTranslationEntity | null>;
  create(data: Partial<ErrorTranslationEntity>, errorCodeEntity: ErrorCodeEntity): Promise<ErrorTranslationEntity>;
  update(id: number, data: Partial<ErrorTranslationEntity>): Promise<ErrorTranslationEntity | null>;
  delete(id: number): Promise<boolean>;
  deleteByErrorCode(errorCode: string): Promise<boolean>;
}

export class ErrorTranslationRepository implements IErrorTranslationRepository {
  private repository: Repository<ErrorTranslationEntity>;

  constructor(private dataSource: DataSource) {
    this.repository = dataSource.getRepository(ErrorTranslationEntity);
  }

  /**
   * Find all translations
   * @param options Optional find options
   */
  async findAll(options: FindManyOptions<ErrorTranslationEntity> = {}): Promise<ErrorTranslationEntity[]> {
    return this.repository.find(options);
  }

  /**
   * Find translations for a specific error code
   * @param errorCode The error code
   * @param options Optional find options
   */
  async findByErrorCode(errorCode: string, options: FindManyOptions<ErrorTranslationEntity> = {}): Promise<ErrorTranslationEntity[]> {
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
    options: FindOneOptions<ErrorTranslationEntity> = {}
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
   * @param data Translation data
   * @param errorCodeEntity The associated error code entity
   */
  async create(
    data: Partial<ErrorTranslationEntity>, 
    errorCodeEntity: ErrorCodeEntity
  ): Promise<ErrorTranslationEntity> {
    const translation = this.repository.create({
      ...data,
      errorCode: errorCodeEntity
    });
    
    return this.repository.save(translation);
  }

  /**
   * Update an existing translation
   * @param id The translation id
   * @param data Updated translation data
   */
  async update(id: number, data: Partial<ErrorTranslationEntity>): Promise<ErrorTranslationEntity | null> {
    return this.dataSource.transaction(async (entityManager: EntityManager) => {
      const translation = await entityManager.findOne(ErrorTranslationEntity, { 
        where: { id } as FindOptionsWhere<ErrorTranslationEntity> 
      });
      
      if (!translation) {
        return null; // Transaction will be rolled back if translation is null
      }
      
      // Update the translation with the new data
      Object.assign(translation, data);
      return entityManager.save(ErrorTranslationEntity, translation);
    });
  }

  /**
   * Delete a translation
   * @param id The translation id
   */
  async delete(id: number): Promise<boolean> {
    const result = await this.dataSource.transaction(async (entityManager: EntityManager) => {
      return entityManager.delete(ErrorTranslationEntity, { 
        id 
      } as FindOptionsWhere<ErrorTranslationEntity>);
    });
    
    return result.affected !== null && result.affected !== undefined && result.affected > 0;
  }

  /**
   * Delete all translations for an error code
   * @param errorCode The error code
   */
  async deleteByErrorCode(errorCode: string): Promise<boolean> {
    const result = await this.dataSource.transaction(async (entityManager: EntityManager) => {
      return entityManager.delete(ErrorTranslationEntity, { 
        errorCode: { code: errorCode } 
      } as FindOptionsWhere<ErrorTranslationEntity>);
    });
    
    return result.affected !== null && result.affected !== undefined && result.affected > 0;
  }
} 