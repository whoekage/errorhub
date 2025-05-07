// Assuming types are defined in a shared location or directly in pages for now
// For a larger app, these would ideally be in a dedicated types file e.g., '@/types'
import { ErrorCode, ErrorCodeFormData } from '../types'; // Updated path

// Mock database for error codes
let mockErrorCodesDb: ErrorCode[] = [
  { id: '1', code: 'USER.NOT_FOUND', defaultMessage: 'User was not found.', categoryId: 'cat1', category: { id: 'cat1', name: 'User Management' }, translations: [] },
  { id: '2', code: 'PAYMENT.DECLINED', defaultMessage: 'Payment was declined.', categoryId: 'cat2', category: { id: 'cat2', name: 'Billing' }, translations: [{lang: 'es', message: 'Pago rechazado'}] },
  { id: '3', code: 'AUTH.SESSION_EXPIRED', defaultMessage: 'Your session has expired. Please log in again.', categoryId: 'cat1', category: { id: 'cat1', name: 'User Management' }, translations: [] },
];

// Simulate API latency
const simulateApiCall = <T,>(data: T): Promise<T> => 
  new Promise(resolve => setTimeout(() => resolve(JSON.parse(JSON.stringify(data))), 500));

export const errorService = {
  getAllErrorCodes: async (): Promise<ErrorCode[]> => {
    console.log('[MockService] getAllErrorCodes called');
    return simulateApiCall(mockErrorCodesDb);
  },

  getErrorCodeById: async (id: string): Promise<ErrorCode | undefined> => {
    console.log(`[MockService] getErrorCodeById called with id: ${id}`);
    const errorCode = mockErrorCodesDb.find(ec => ec.id === id);
    return simulateApiCall(errorCode);
  },

  createErrorCode: async (data: ErrorCodeFormData): Promise<ErrorCode> => {
    console.log('[MockService] createErrorCode called with data:', data);
    const newId = `ec-${Date.now()}`;
    const newErrorCode: ErrorCode = {
      ...data, // This includes code, defaultMessage, categoryId, and optional translations
      id: newId,
      // category object would be populated by backend or joined in the page component
    };
    mockErrorCodesDb.push(newErrorCode);
    return simulateApiCall(newErrorCode);
  },

  updateErrorCode: async (id: string, data: Partial<ErrorCodeFormData>): Promise<ErrorCode | undefined> => {
    console.log(`[MockService] updateErrorCode called for id: ${id} with data:`, data);
    const index = mockErrorCodesDb.findIndex(ec => ec.id === id);
    if (index !== -1) {
      // Ensure existing translations are not lost if not provided in partial data
      const currentTranslations = mockErrorCodesDb[index].translations;
      const updatedErrorCode = { 
        ...mockErrorCodesDb[index], 
        ...data, 
        translations: data.translations || currentTranslations 
      } as ErrorCode;
      mockErrorCodesDb[index] = updatedErrorCode;
      return simulateApiCall(updatedErrorCode);
    }
    return simulateApiCall(undefined);
  },

  deleteErrorCode: async (id: string): Promise<void> => {
    console.log(`[MockService] deleteErrorCode called for id: ${id}`);
    mockErrorCodesDb = mockErrorCodesDb.filter(ec => ec.id !== id);
    return simulateApiCall(undefined as void);
  },
}; 