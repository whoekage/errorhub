import { DIContainer } from './di';
import { ErrorService } from './services/ErrorService';
import { CategoryService } from './services/CategoryService';
import { TranslationService } from './services/TranslationService';
import { LanguageService } from './services/LanguageService';

declare module 'fastify' {
  interface FastifyInstance {
    // DI container
    di: DIContainer;
    
    // Direct service access for convenience
    errorService: ErrorService;
    categoryService: CategoryService;
    translationService: TranslationService;
    languageService: LanguageService;
  }
} 