export interface ErrorData {
  id: string;
  code: string;
  message: string;
  category: string;
  createdAt: string; // Or Date, depending on how you'll handle it
}

export interface ErrorCode {
  id: string;
  code: string;
  defaultMessage: string;
  categoryId: string;
  category?: { id: string; name: string }; // For display
  translations?: Array<{ lang: string; message: string }>; // Keep for future use, make optional
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

// Data structure for the form, especially for create/update operations
export interface ErrorCodeFormData {
  id?: string; // Optional: present if editing, absent if creating
  code: string;
  defaultMessage: string;
  categoryId: string;
  translations?: Array<{ lang: string; message: string }>; // Form might also handle translations
}

// You might want to add other shared types here as the application grows. 