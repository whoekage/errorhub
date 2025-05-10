import api from './axios';
import type { AxiosError } from 'axios';
// Inline Category type to avoid import restriction
export interface Category {
  id: number;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryListResponse {
  data: Category[];
  meta: {
    totalItems?: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  links: {
    next?: string;
    prev?: string;
  };
}

export async function getCategories(params?: Record<string, unknown>): Promise<CategoryListResponse> {
  const response = await api.get<CategoryListResponse>('/categories', { params });
  return response.data;
}

export async function getCategory(id: number): Promise<Category | null> {
  try {
    const response = await api.get<Category>(`/categories/${id}`);
    return response.data;
  } catch (e: unknown) {
    if (isAxiosError(e) && e.response && e.response.status === 404) return null;
    throw e;
  }
}

function isAxiosError(error: unknown): error is AxiosError {
  return typeof error === 'object' && error !== null && 'isAxiosError' in error;
}

export async function updateCategory(id: number, data: Partial<Omit<Category, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Category> {
  const response = await api.put<{ data: Category }>(`/categories/${id}`, data);
  return response.data.data;
}

export async function deleteCategory(id: number): Promise<void> {
  await api.delete(`/categories/${id}`);
}