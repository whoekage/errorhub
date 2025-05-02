import { HttpClient, ErrorHubConfig, GetErrorOptions, ErrorResult } from '../core';

/**
 * ErrorHub клиент для Node.js
 */
export class ErrorHub {
  private client: HttpClient;
  
  /**
   * Создать экземпляр ErrorHub для Node.js
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

  /**
   * Создать middleware для Express
   * @param options Опции middleware
   */
  createExpressMiddleware(options: {
    defaultLanguage?: string;
    headerName?: string;
    expose?: boolean;
  } = {}) {
    const { 
      defaultLanguage = 'en',
      headerName = 'accept-language',
      expose = true
    } = options;

    return (req: any, res: any, next: any) => {
      // Добавляем метод для получения сообщений об ошибках в контекст запроса
      req.errorHub = {
        getError: async (code: string, params?: Record<string, string>) => {
          // Определяем язык из заголовка или используем язык по умолчанию
          const language = req.headers[headerName.toLowerCase()] || defaultLanguage;
          return this.getError(code, language, params);
        },
        getMessage: async (code: string, params?: Record<string, string>) => {
          const language = req.headers[headerName.toLowerCase()] || defaultLanguage;
          return this.getMessage(code, language, params);
        }
      };

      // Добавляем метод для отправки ошибок с правильной локализацией
      if (expose) {
        res.sendErrorResponse = async (code: string, statusCode = 400, params?: Record<string, string>) => {
          const language = req.headers[headerName.toLowerCase()] || defaultLanguage;
          const error = await this.getError(code, language, params);
          
          res.status(statusCode).json({
            error: {
              code: error.code,
              message: error.message,
              ...error.metadata ? { metadata: error.metadata } : {}
            }
          });
        };
      }

      next();
    };
  }
}

// Экспорт типов
export * from '../core/types'; 