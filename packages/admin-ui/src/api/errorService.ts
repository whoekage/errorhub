import api from './axios'; // Используем тот же 'axios' инстанс, что и в других сервисах

// Тип данных, который ожидает API при создании
// Этот интерфейс должен совпадать с createErrorCodeAPISchema из CreateErrorCodePage.tsx
export interface CreateErrorCodeAPIPayload {
  code: string;
  translations: Record<string, string>; // Если переводы не передаются, это будет {}
  categoryIds: string[];               // Если категории не выбраны, это будет []
  context?: string;
}

// Тип ответа от API при успешном создании
// Этот интерфейс должен соответствовать реальной структуре ответа вашего бэкенда
// для POST /api/errors
export interface CreatedErrorCodeAPIResponse {
  id: number;
  code: string;
  status: 'draft' | 'published' | 'archived';
  context: string | null;
  createdAt: string;
  updatedAt: string;
  translations: Array<{
    id: number;
    language: string;
    message: string;
  }>;
  categories: Array<{
    id: string;
    name: string;
    description?: string;
  }>;
}

/**
 * Создает новый код ошибки.
 * @param data - Данные для создания кода ошибки.
 * @returns Промис с созданным кодом ошибки.
 */
export async function createErrorCodeAPI(data: CreateErrorCodeAPIPayload): Promise<CreatedErrorCodeAPIResponse> {
  // Предполагаем, что базовый URL '/api' уже настроен в инстансе './axios'
  // Если нет, путь должен быть '/api/errors'
  const response = await api.post<CreatedErrorCodeAPIResponse>('/errors', data);
  return response.data;
}

/**
 * Получает детали одного кода ошибки по его ID.
 * @param id - ID кода ошибки.
 * @returns Промис с деталями кода ошибки.
 */
export async function getErrorCodeById(id: number): Promise<CreatedErrorCodeAPIResponse> {
  const response = await api.get<CreatedErrorCodeAPIResponse>(`/errors/${id}`);
  return response.data;
} 