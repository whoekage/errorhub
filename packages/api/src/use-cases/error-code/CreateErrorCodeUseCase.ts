import { DataSource, EntityManager } from 'typeorm';
import { ErrorService } from '@/services/ErrorService';
import { TranslationService } from '@/services/TranslationService';
// Если для проверки категории используется CategoryService:
// import { CategoryService } from '@/services/CategoryService'; 
import { ErrorCodeEntity, ErrorCodeStatus } from '@/db';
import { createErrorCodeRequestSchema } from '@/dto/errors/create.dto'; // Полная схема DTO с UI
import { z } from 'zod';
import { ServiceError } from '@/utils/errors';
import { Logger } from 'pino';
import pino from 'pino';

// Тип данных, ожидаемых от уровня контроллера/роута
type CreateErrorCodeUseCaseDto = z.infer<typeof createErrorCodeRequestSchema>;

export class CreateErrorCodeUseCase {
  private logger: Logger;

  constructor(
    private dataSource: DataSource,
    private errorService: ErrorService,
    private translationService: TranslationService,
    // private categoryService: CategoryService, // Раскомментировать, если используется
  ) {
    this.logger = pino({ name: 'CreateErrorCodeUseCase' });
  }

  async execute(data: CreateErrorCodeUseCaseDto): Promise<ErrorCodeEntity> {
    this.logger.info({ data }, 'Starting to create error code with translations and categories using new approach.');

    return this.dataSource.transaction(async (entityManager: EntityManager) => {
      // 1. Создание ErrorCodeEntity и ассоциация категорий через ErrorService
      // ErrorService.create теперь принимает categoryIds и status
      const errorDataForService = {
        code: data.code,
        context: data.context,
        status: data.status as ErrorCodeStatus | undefined,
        categoryIds: data.categoryIds,
      };
      
      const errorCode = await this.errorService.create(entityManager, errorDataForService);
      this.logger.info({ errorCodeId: errorCode.id }, 'ErrorCode entity created/updated with categories by ErrorService.');

      // 2. Создание переводов через TranslationService
      if (data.translations && Object.keys(data.translations).length > 0) {
        const translationsArray = Object.entries(data.translations)
          .filter(([, message]) => typeof message === 'string' && message.trim() !== '') // Filter out empty/invalid messages
          .map(([language, message]) => ({ language, message: message as string }));

        if (translationsArray.length > 0) {
          this.logger.info({ errorCodeId: errorCode.id, translationCount: translationsArray.length }, 'Processing translations via TranslationService.createBulk.');
          try {
            await this.translationService.createBulk(entityManager, errorCode.id, translationsArray);
            this.logger.info({ errorCodeId: errorCode.id }, 'Translations processed by TranslationService.');
          } catch (error) {
            this.logger.error({ error, errorCodeId: errorCode.id }, 'Failed to create translations in bulk via TranslationService.');
            // Пробрасываем ошибку, чтобы откатить транзакцию
            // Можно уточнить тип ошибки, если TranslationService выбрасывает специфичные ошибки
            throw new ServiceError('Failed during bulk translation creation.', { cause: error });
          }
        }
      }

      // 3. Возвращаем созданный/обновленный код ошибки со всеми связями.
      // ErrorService.create уже должен вернуть сущность с категориями.
      // После createBulk нам нужно убедиться, что и переводы подгружены в возвращаемый объект.
      const resultErrorCode = await entityManager.getRepository(ErrorCodeEntity).findOne({
        where: { id: errorCode.id },
        relations: ['categories', 'translations'], // Явно загружаем все нужные связи
      });

      if (!resultErrorCode) {
        this.logger.error({ errorCodeId: errorCode.id }, 'Failed to re-fetch created error code with all relations.');
        throw new ServiceError('Failed to retrieve created error code with its relations.');
      }
      
      this.logger.info({ resultErrorCodeId: resultErrorCode.id }, 'Successfully created error code and associated data.');
      return resultErrorCode;
    });
  }
} 