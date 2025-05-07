// Assuming Category type is defined in a shared location or directly in pages for now
import { Category } from '../types'; // Updated path

// Mock database for categories
let mockCategoriesDb: Category[] = [
  { id: 'cat1', name: 'User Management' },
  { id: 'cat2', name: 'Billing' },
  { id: 'cat3', name: 'General' },
  { id: 'cat4', name: 'API Services' },
];

// Simulate API latency (can be shared if services are in the same folder or via a helper)
const simulateApiCall = <T,>(data: T): Promise<T> => 
  new Promise(resolve => setTimeout(() => resolve(JSON.parse(JSON.stringify(data))), 300));

export const categoryService = {
  getAllCategories: async (): Promise<Category[]> => {
    console.log('[MockService] getAllCategories called');
    return simulateApiCall(mockCategoriesDb);
  },

  getCategoryById: async (id: string): Promise<Category | undefined> => {
    console.log(`[MockService] getCategoryById called with id: ${id}`);
    const category = mockCategoriesDb.find(cat => cat.id === id);
    return simulateApiCall(category);
  },

  createCategory: async (data: Omit<Category, 'id'>): Promise<Category> => {
    console.log('[MockService] createCategory called with data:', data);
    const newId = `cat-${Date.now()}`;
    const newCategory: Category = {
      ...data,
      id: newId,
    };
    mockCategoriesDb.push(newCategory);
    return simulateApiCall(newCategory);
  },

  updateCategory: async (id: string, data: Partial<Omit<Category, 'id'>>): Promise<Category | undefined> => {
    console.log(`[MockService] updateCategory called for id: ${id} with data:`, data);
    const index = mockCategoriesDb.findIndex(cat => cat.id === id);
    if (index !== -1) {
      const updatedCategory = { ...mockCategoriesDb[index], ...data } as Category;
      mockCategoriesDb[index] = updatedCategory;
      return simulateApiCall(updatedCategory);
    }
    return simulateApiCall(undefined);
  },

  deleteCategory: async (id: string): Promise<void> => {
    console.log(`[MockService] deleteCategory called for id: ${id}`);
    mockCategoriesDb = mockCategoriesDb.filter(cat => cat.id !== id);
    return simulateApiCall(undefined as void);
  },
}; 