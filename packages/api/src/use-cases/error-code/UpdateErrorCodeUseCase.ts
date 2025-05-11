import { DataSource, In } from 'typeorm';
import { ErrorCodeEntity, ErrorCodeStatus } from '@/db/entities/ErrorCodeEntity';
import { ErrorCategoryEntity } from '@/db/entities/ErrorCategoryEntity';
import { ErrorTranslationEntity } from '@/db/entities/ErrorTranslationEntity';
import { UpdateErrorCodeRequestDto } from '@/dto/errors';
import { ResourceNotFoundError, ResourceConflictError } from '@/utils/errors';

export class UpdateErrorCodeUseCase {
  constructor(
    private readonly dataSource: DataSource,
    // ErrorService and TranslationService are no longer needed in constructor
    // if all logic is self-contained or uses entityManager directly.
  ) {}

  async execute(id: number, data: UpdateErrorCodeRequestDto): Promise<ErrorCodeEntity> {
    return this.dataSource.transaction(async (entityManager) => {
      const errorRepository = entityManager.getRepository(ErrorCodeEntity);
      const translationRepo = entityManager.getRepository(ErrorTranslationEntity);
      const categoryRepo = entityManager.getRepository(ErrorCategoryEntity);

      const errorCode = await errorRepository.findOne({
        where: { id },
        relations: ['categories', 'translations'],
      });

      if (!errorCode) {
        throw new ResourceNotFoundError(`Error code with ID "${id}" not found.`);
      }

      let hasChanges = false;

      // Update code, if provided and different, with uniqueness check
      if (data.code !== undefined && errorCode.code !== data.code) {
        const existingWithNewCode = await errorRepository.findOneBy({ code: data.code });
        if (existingWithNewCode && existingWithNewCode.id !== errorCode.id) {
          throw new ResourceConflictError(`Error code value "${data.code}" already exists.`);
        }
        errorCode.code = data.code;
        hasChanges = true;
      }

      // Update context
      if (data.context !== undefined && errorCode.context !== data.context) {
        errorCode.context = data.context;
        hasChanges = true;
      }

      // Update status
      if (data.status !== undefined && errorCode.status !== data.status) {
        errorCode.status = data.status as ErrorCodeStatus;
        hasChanges = true;
      }

      // Update categories
      if (data.categoryIds !== undefined) {
        const currentCategoryIds = errorCode.categories.map(c => c.id).sort();
        const newCategoryIds = [...new Set(data.categoryIds)].sort();

        if (JSON.stringify(currentCategoryIds) !== JSON.stringify(newCategoryIds)) {
          if (newCategoryIds.length > 0) {
            const categories = await categoryRepo.findBy({ id: In(newCategoryIds) });
            if (categories.length !== newCategoryIds.length) {
              // console.warn('Some category IDs provided for update were not found.');
            }
            errorCode.categories = categories;
          } else {
            errorCode.categories = [];
          }
          hasChanges = true;
        }
      }

      // Update translations
      if (data.translations !== undefined) {
        const providedLangs = Object.keys(data.translations);
        const existingTranslationsMap = new Map(errorCode.translations.map(t => [t.language, t]));
        let translationsChanged = false;

        for (const lang of providedLangs) {
          const message = data.translations[lang];

          if (message !== undefined && message !== null && message.trim() !== '') {
            const existingTranslation = existingTranslationsMap.get(lang);
            if (existingTranslation) {
              if (existingTranslation.message !== message) {
                existingTranslation.message = message;
                await translationRepo.save(existingTranslation);
                translationsChanged = true;
              }
              existingTranslationsMap.delete(lang);
            } else {
              const newTranslation = translationRepo.create({ errorCode, language: lang, message });
              await translationRepo.save(newTranslation);
              translationsChanged = true;
            }
          } else { 
            if (existingTranslationsMap.has(lang)) {
              await translationRepo.remove(existingTranslationsMap.get(lang)!);
              translationsChanged = true;
              existingTranslationsMap.delete(lang);
            }
          }
        }

        if (existingTranslationsMap.size > 0) {
          for (const translationToDelete of existingTranslationsMap.values()) {
            await translationRepo.remove(translationToDelete);
          }
          translationsChanged = true;
        }
        if (translationsChanged) hasChanges = true;
      }

      if (hasChanges) {
        await errorRepository.save(errorCode);
      }
      
      return errorRepository.findOneOrFail({
        where: { id: errorCode.id },
        relations: ['categories', 'translations'],
      });
    });
  }
} 