import React, { useState, useEffect } from 'react';
// Import types from the new central types location
import { Category, ErrorCodeFormData } from '../types';
import { categoryService } from '../services/categoryService'; // Import categoryService

// Import shadcn/ui components with corrected casing based on linter feedback
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert"; // For potential form-level errors

// Define a list of supported languages for translations
// In a real app, this might come from config or API
const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English' }, // Default message is often considered 'en'
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
];

// Removed local interface definitions as they are now imported.
// interface ErrorCodeFormData { ... }
// interface Category { ... }

interface ErrorCodeFormProps {
  initialData?: ErrorCodeFormData | null;
  onSubmit: (formData: ErrorCodeFormData) => void;
  onCancel: () => void;
  categories: Category[]; // Changed to non-optional as it's crucial now
  // Callback to inform parent (ErrorCodesPage) that categories list needs refresh and which one to select
  onCategoryCreated: (newCategory: Category) => void; 
}

const ErrorCodeForm: React.FC<ErrorCodeFormProps> = ({ 
  initialData, 
  onSubmit, 
  onCancel,
  categories, // Now non-optional
  onCategoryCreated
}) => {
  const [formData, setFormData] = useState<ErrorCodeFormData>(() => {
    const defaults: Omit<ErrorCodeFormData, 'id'> = {
      code: '',
      defaultMessage: '',
      categoryId: '',
      translations: [], // Initialize as empty array
    };
    // If initialData is provided, merge its translations. Ensure it's an array.
    const initialTranslations = initialData?.translations || [];
    return initialData 
      ? { ...defaults, ...initialData, translations: initialTranslations }
      : defaults;
  });

  useEffect(() => {
    const defaults: Omit<ErrorCodeFormData, 'id'> = {
      code: '',
      defaultMessage: '',
      categoryId: '',
      translations: [],
    };
    const effectiveInitialData = initialData 
        ? { ...defaults, ...initialData, translations: initialData.translations || [] }
        : defaults;
    setFormData(effectiveInitialData as ErrorCodeFormData);
  }, [initialData]);

  const handleChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTranslationChange = (langCode: string, message: string) => {
    setFormData(prev => {
      const existingTranslations = prev.translations || [];
      const existingTranslationIndex = existingTranslations.findIndex(t => t.lang === langCode);

      let updatedTranslations;
      if (existingTranslationIndex > -1) {
        // Update existing translation
        updatedTranslations = existingTranslations.map((t, index) => 
          index === existingTranslationIndex ? { ...t, message } : t
        );
      } else {
        // Add new translation
        updatedTranslations = [...existingTranslations, { lang: langCode, message }];
      }
      return { ...prev, translations: updatedTranslations };
    });
  };

  // Function to add a translation field for a language if not already present
  // For now, we will render all supported languages and allow input directly.
  // A more dynamic "Add Translation" button might be useful later.

  const [showNewCategoryDialog, setShowNewCategoryDialog] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryError, setNewCategoryError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null); // For main form validation errors

  // Handler to create a new category
  const handleCreateNewCategory = async () => {
    if (!newCategoryName.trim()) {
      setNewCategoryError('Category name cannot be empty.');
      return;
    }
    setIsCreatingCategory(true);
    setNewCategoryError(null);
    try {
      const createdCategory = await categoryService.createCategory({ name: newCategoryName });
      onCategoryCreated(createdCategory); // Notify parent
      setNewCategoryName('');
      setShowNewCategoryDialog(false);
    } catch (err: unknown) {
      let message = 'Unknown error';
      if (err instanceof Error) message = err.message;
      setNewCategoryError(`Failed to create category: ${message}`);
    } finally {
      setIsCreatingCategory(false);
    }
  };
  
  // Effect to set categoryId when a new category is created and passed via initialData trick or prop
  // This might be better handled by parent setting initialData correctly after creation.
  // For now, we assume onCategoryCreated will trigger a re-render with updated categories 
  // and potentially select the new one.

  // Reset new category form when it's shown/hidden
  useEffect(() => {
    if (!showNewCategoryDialog) {
        setNewCategoryName('');
        setNewCategoryError(null);
    }
  }, [showNewCategoryDialog]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!formData.code || !formData.defaultMessage || !formData.categoryId) {
      setFormError('Please fill in all required fields: Code, Default Message, and Category.');
      return;
    }
    const finalFormData = {
        ...formData,
        translations: formData.translations?.filter(t => t.message.trim() !== '')
    };
    onSubmit(finalFormData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h2 className="text-2xl font-semibold border-b pb-2 mb-6">
        {initialData ? 'Edit Error Code' : 'Create New Error Code'}
      </h2>

      {formError && (
          <Alert variant="destructive" className="mb-4">
              <AlertDescription>{formError}</AlertDescription>
          </Alert>
      )}
      
      <div className="space-y-2">
        <Label htmlFor="code">Error Code:*</Label>
        <Input id="code" name="code" value={formData.code} onChange={(e) => handleChange(e.target.name, e.target.value)} required />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="defaultMessage">Default Message:* (English)</Label>
        <Textarea id="defaultMessage" name="defaultMessage" value={formData.defaultMessage} onChange={(e) => handleChange(e.target.name, e.target.value)} required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="categoryId">Category:*</Label>
        <div className="flex items-center space-x-2">
          <Select name="categoryId" value={formData.categoryId} onValueChange={(value) => handleSelectChange('categoryId', value)} required>
            <SelectTrigger id="categoryId" className="flex-grow">
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map(category => (
                <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
              ))}
              {categories.length === 0 && <SelectItem value="loading" disabled>Loading categories...</SelectItem>}
            </SelectContent>
          </Select>
          <Button type="button" variant="outline" onClick={() => setShowNewCategoryDialog(true)}>
            + New Category
          </Button>
        </div>
      </div>

      <Dialog open={showNewCategoryDialog} onOpenChange={setShowNewCategoryDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Category</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="newCategoryNameModal" className="text-right">
                Name
              </Label>
              <Input id="newCategoryNameModal" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} className="col-span-3" />
            </div>
            {newCategoryError && (
                <Alert variant="destructive" className="col-span-4">
                    <AlertDescription>{newCategoryError}</AlertDescription>
                </Alert>
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild>
                <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="button" onClick={handleCreateNewCategory} disabled={isCreatingCategory}>
              {isCreatingCategory ? 'Creating...' : 'Save Category'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="space-y-4 pt-4 border-t">
        <h3 className="text-xl font-semibold">Translations</h3>
        {SUPPORTED_LANGUAGES.map(lang => {
          if (lang.code === 'en') return null;
          const translationEntry = formData.translations?.find(t => t.lang === lang.code);
          const message = translationEntry ? translationEntry.message : '';
          return (
            <div key={lang.code} className="space-y-2">
              <Label htmlFor={`translation-${lang.code}`}>{lang.name}:</Label>
              <Input id={`translation-${lang.code}`} value={message} onChange={(e) => handleTranslationChange(lang.code, e.target.value)} placeholder={`Enter ${lang.name} translation`} />
            </div>
          );
        })}
      </div>

      <div className="flex justify-end space-x-2 pt-6 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isCreatingCategory}>
          {initialData ? 'Save Changes' : 'Create Error Code'}
        </Button>
      </div>
    </form>
  );
};

export default ErrorCodeForm; 