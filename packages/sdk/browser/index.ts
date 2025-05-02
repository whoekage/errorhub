import { HttpClient, ErrorHubConfig, GetErrorOptions, ErrorResult } from '../core';

/**
 * ErrorHub клиент для браузера
 */
export class ErrorHub {
  private client: HttpClient;
  
  /**
   * Создать экземпляр ErrorHub для браузера
   * @param config Конфигурация
   */
  constructor(config: ErrorHubConfig) {
    this.client = new HttpClient(config);
  }

  /**
   * Получить сообщение об ошибке
   * @param code Код ошибки
   * @param language Язык (опционально, по умолчанию из конфигурации)
   * @param params Параметры для подстановки в шаблон (опционально)
   */
  async getError(code: string, language?: string, params?: Record<string, string>): Promise<ErrorResult> {
    return this.client.getError({ code, language, params });
  }

  /**
   * Получить текст сообщения об ошибке
   * @param code Код ошибки
   * @param language Язык (опционально, по умолчанию из конфигурации)
   * @param params Параметры для подстановки в шаблон (опционально)
   */
  async getMessage(code: string, language?: string, params?: Record<string, string>): Promise<string> {
    return this.client.getErrorMessage({ code, language, params });
  }

  /**
   * Получить пакет ошибок
   * @param codes Массив кодов ошибок
   * @param language Язык (опционально, по умолчанию из конфигурации)
   */
  async getBulkErrors(codes: string[], language?: string): Promise<ErrorResult[]> {
    return this.client.getBulkErrors(codes, language);
  }
}

// Экспорт типов
export * from '../core/types';

// Создание глобального экземпляра для добавления в window
if (typeof window !== 'undefined') {
  (window as any).ErrorHub = ErrorHub;
} 