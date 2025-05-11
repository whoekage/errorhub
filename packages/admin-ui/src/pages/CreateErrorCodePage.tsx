import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { getEnabledLanguages } from '@/api/languageService';
import { getCategories, type Category, type CategoryListResponse } from '@/api/categoryService';
import { useNavigate } from 'react-router-dom';
import { createErrorCodeAPI, type CreatedErrorCodeAPIResponse } from '@/api/errorService';

// shadcn/ui components (ensure these are added to your project)
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { Label } from "@/components/ui/label";

// Dummy data and schema (assuming they are in a utility file or defined here for now)
// For a real app, move these to appropriate locations e.g., @/lib/data, @/lib/schemas

// Интерфейс для ответа от API при создании
// interface CreatedErrorCodeResponse { ... }

export const allPossibleLanguages = ['kk', 'kg', 'uz', 'ru', 'en'] as const;

// Helper to get full language name
const languageDisplayNames: Record<typeof allPossibleLanguages[number] | string, string> = {
  kk: 'Kazakh',
  kg: 'Kyrgyz',
  uz: 'Uzbek',
  ru: 'Russian',
  en: 'English'
};

const translationSchema = z.object(
  Object.fromEntries(
    allPossibleLanguages.map(lang => [lang, z.string().optional()])
  ) as Record<typeof allPossibleLanguages[number] | string, z.ZodOptional<z.ZodString>>
);

export const createErrorCodeAPISchema = z.object({
  code: z.string().min(1, { message: "Error Identifier is required." }),
  translations: z.record(z.string()),
  categoryIds: z.array(z.string()),
  context: z.string().optional(),
});

export const createErrorCodeFormSchema = z.object({
  code: z.string().min(1, { message: "Error Identifier is required." }),
  translations: translationSchema,
  selectedCategories: z.array(z.string()),
  context: z.string().optional(),
});

export type CreateErrorCodeFormValues = z.infer<typeof createErrorCodeFormSchema>;

export const defaultValues: CreateErrorCodeFormValues = {
  code: '',
  translations: Object.fromEntries(allPossibleLanguages.map(lang => [lang, ''])) as Record<typeof allPossibleLanguages[number], string>,
  selectedCategories: [],
  context: '',
};

const CreateErrorCodePage: React.FC = () => {
  const navigate = useNavigate();
  const form = useForm<CreateErrorCodeFormValues>({
    resolver: zodResolver(createErrorCodeFormSchema),
    defaultValues: defaultValues as CreateErrorCodeFormValues,
  });

  const { control, handleSubmit, setValue, watch, setError, formState: { errors, isSubmitting } } = form;

  // Fetch enabled languages
  const {
    data: enabledLanguages = [], // Default to empty array
    isLoading: isLoadingLanguages,
    isError: isErrorLanguages,
  } = useQuery<string[], Error>({
    queryKey: ['enabledLanguages'],
    queryFn: getEnabledLanguages,
  });

  // Fetch categories from backend
  const {
    data: categoriesResponse,
    isLoading: isLoadingCategories,
    isError: isErrorCategories,
  } = useQuery<CategoryListResponse, Error>({
    queryKey: ['allCategories'], // Using a different queryKey for all categories
    queryFn: () => getCategories({ limit: 1000 }), // Fetch a large number, assuming no pagination for selection here
  });

  const allFetchedCategories: Category[] = categoriesResponse?.data || [];

  const onSubmit = async (data: CreateErrorCodeFormValues) => {
    console.log('CreateErrorCodePage onSubmit triggered. Form data:', data);

    const translationsToSubmit: Record<string, string> = {};
    const languagesToConsider: readonly typeof allPossibleLanguages[number][] = enabledLanguages.length > 0 ? enabledLanguages as typeof allPossibleLanguages[number][] : allPossibleLanguages;

    languagesToConsider.forEach(lang => {
      if (data.translations[lang] && data.translations[lang]!.trim() !== '') {
        translationsToSubmit[lang] = data.translations[lang]!;
      }
    });
    
    const categoryIdsToSubmit: string[] = [];
    if (allFetchedCategories && data.selectedCategories) {
      data.selectedCategories.forEach(selectedName => {
        const foundCategory = allFetchedCategories.find(cat => cat.name === selectedName);
        if (foundCategory) {
          categoryIdsToSubmit.push(foundCategory.id.toString());
        }
      });
    }

    const dataToSubmitForAPI = {
      code: data.code,
      translations: translationsToSubmit,
      categoryIds: categoryIdsToSubmit,
      context: data.context || undefined,
    };

    // Валидация данных перед отправкой через API схему (опционально, но полезно)
    try {
      createErrorCodeAPISchema.parse(dataToSubmitForAPI);
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        console.error("API Data Validation Error:", validationError.flatten().fieldErrors);
        setError("root.serverError", { message: "Data prepared for API is invalid. Check console."});
        return;
      }
    }
    
    console.log('Data to submit to API:', dataToSubmitForAPI);

    try {
      // Используем CreatedErrorCodeAPIResponse для типа ответа
      const createdErrorCode: CreatedErrorCodeAPIResponse = await createErrorCodeAPI(dataToSubmitForAPI);
      
      console.log('Successfully created error code via API:', createdErrorCode);
      // Изменяем навигацию на ID
      navigate(`/errors/update/${createdErrorCode.id}`); 

    } catch (apiError: unknown) {
      console.error('Failed to create error code via API:', apiError);
      let errorMessage = "An unexpected error occurred while saving.";
      let errorType = "APIError";
      if (typeof apiError === 'object' && apiError !== null && 
          'response' in apiError && 
          (apiError as { response?: unknown }).response && 
          typeof (apiError as { response: unknown }).response === 'object' && 
          (apiError as { response: object | null }).response !== null &&
          'data' in (apiError as { response: { data?: unknown } }).response &&
          (apiError as { response: { data?: unknown } }).response.data &&
          typeof (apiError as { response: { data: unknown } }).response.data === 'object' &&
          (apiError as { response: { data: object | null } }).response.data !== null
          ) {
        const errorData = (apiError as { response: { data: { message?: string; error?: string } } }).response.data;
        errorMessage = typeof errorData.message === 'string' ? errorData.message : errorMessage;
        errorType = typeof errorData.error === 'string' ? errorData.error : errorType;
      } else if (apiError instanceof Error) { 
        errorMessage = apiError.message;
      }
      setError("root.serverError", { 
          type: errorType, 
          message: errorMessage 
      });
    }
  };

  // State for category search filter
  const [categorySearch, setCategorySearch] = useState('');

  // Watch the selected categories to display chips
  const selectedCategories = watch('selectedCategories');

  // Filter fetched categories based on search term
  const filteredFetchedCategories = allFetchedCategories.filter(category => 
    category.name.toLowerCase().includes(categorySearch.toLowerCase())
  );

  // Function to remove a category (called from chip)
  const removeCategory = (categoryToRemove: string) => {
    const currentValues = selectedCategories || [];
    setValue('selectedCategories', 
             currentValues.filter(value => value !== categoryToRemove), 
             { shouldValidate: true });
  };

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <div className="flex justify-between items-center mb-2">
        <h1 className="text-3xl font-bold">Add an Error Message to Your System</h1>
        <Button type="submit" form="create-error-code-form" disabled={isSubmitting || isLoadingLanguages || isLoadingCategories}>
          {isSubmitting ? 'Saving...' : (isLoadingLanguages || isLoadingCategories ? 'Loading Data...' : 'Save & Activate Error')}
        </Button>
      </div>
      <p className="text-sm text-muted-foreground mb-2">Error codes help standardize how errors appear across your application in multiple languages.</p>
      <p className="text-xs text-muted-foreground mb-6">All fields with * must be completed before saving.</p>

      <Form {...form}>
        <form id="create-error-code-form" onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Column 1 & 2: Create Error Form (Card) */}
          <Card className="md:col-span-2">
            <CardHeader><CardTitle>Define Your Error Message</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <FormField control={control} name="code" render={({ field }) => ( <FormItem> <FormLabel>Error Identifier*</FormLabel> <FormControl><Input placeholder="e.g., AUTH.LOGIN_FAILED" {...field} /></FormControl> <FormDescription>Use format DOMAIN.ACTION_RESULT (e.g., AUTH.LOGIN_FAILED)</FormDescription> <FormMessage /> </FormItem> )}/>
              
              <FormField control={control} name="context" render={({ field }) => ( <FormItem> <FormLabel>Context (Optional)</FormLabel> <FormControl><Textarea placeholder="Optional: Provide context for this error..." {...field} value={field.value || ''} /></FormControl> <FormMessage /> </FormItem> )}/>

              {isLoadingLanguages && <p>Loading language fields...</p>}
              {isErrorLanguages && <p className="text-destructive">Error loading languages. Please try again.</p>}
              {!isLoadingLanguages && !isErrorLanguages && enabledLanguages.length === 0 && <p className="text-muted-foreground">No languages enabled. Please enable languages in settings.</p>}

              {!isLoadingLanguages && !isErrorLanguages && enabledLanguages.map((lang) => {
                const fullLangName = languageDisplayNames[lang] || lang.toUpperCase();
                return (
                  <FormField key={lang} control={control} name={`translations.${lang as typeof allPossibleLanguages[number]}`} render={({ field }) => ( <FormItem> <FormLabel>{fullLangName} Translation {enabledLanguages.length === 0 && '(Default Fallback)'}</FormLabel> <FormControl><Textarea placeholder={`How this error appears to ${fullLangName}-speaking users`} {...field} value={field.value || ''} /></FormControl> <FormMessage /> </FormItem> )}/>
                );
              })}
              {errors.translations && typeof errors.translations.message === 'string' && (
                 <p className="text-sm font-medium text-destructive">{errors.translations.message}</p>
              )}
              {errors.root?.serverError && (
                <p className="text-sm font-medium text-destructive mt-2">
                    {errors.root.serverError.message}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Column 3: Publish (Category Selection) */}
          <Card className="md:col-span-1">
            <CardHeader><CardTitle>Categorize Your Error*</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {/* Selected Categories Chips */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">This error belongs to:</Label>
                <div className="flex flex-wrap gap-1 min-h-[40px] rounded-md border border-input bg-background p-2">
                    {selectedCategories?.length === 0 && <span className="text-xs text-muted-foreground">Select at least one category below</span>}
                    {selectedCategories?.map((categoryName) => (
                        <Badge key={categoryName} variant="secondary">
                            {categoryName}
                            <button 
                                type="button" 
                                className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                onClick={() => removeCategory(categoryName)}
                            >
                                <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                            </button>
                        </Badge>
                    ))}
                </div>
              </div>

              {/* Search Input */}
              <div className="space-y-2">
                <Label htmlFor="category-search">Find relevant categories</Label>
                <Input 
                  id="category-search"
                  placeholder="Search..."
                  value={categorySearch}
                  onChange={(e) => setCategorySearch(e.target.value)}
                  disabled={isLoadingCategories}
                />
              </div>
              
              {/* Category Checkbox List (No ScrollArea) */}
               <FormField
                  control={control}
                  name="selectedCategories"
                  render={({ field }) => (
                    <FormItem className="mt-4 border rounded-md p-4 space-y-4">
                      <div className="mb-4">
                          <FormLabel className="text-base font-semibold">Choose from these categories</FormLabel>
                      </div>
                      {isLoadingCategories && <p>Loading categories...</p>}
                      {isErrorCategories && <p className="text-destructive">Error loading categories. Please try again.</p>}
                      {!isLoadingCategories && !isErrorCategories && allFetchedCategories.length === 0 && (
                        <p className="text-muted-foreground">No categories available. Create a category first.</p>
                      )}
                      {!isLoadingCategories && !isErrorCategories && filteredFetchedCategories.map((category) => {
                        const checkboxId = `category-${category.id}`;
                        return (
                          <div key={category.id} className="items-top flex space-x-3">
                            <FormControl>
                              <Checkbox
                                id={checkboxId}
                                checked={field.value?.includes(category.name)}
                                onCheckedChange={(checked) => {
                                  const currentSelectedNames = field.value || [];
                                  if (checked) {
                                    setValue('selectedCategories', [...currentSelectedNames, category.name], { shouldValidate: true });
                                  } else {
                                    setValue('selectedCategories', currentSelectedNames.filter(name => name !== category.name), { shouldValidate: true });
                                  }
                                }}
                              />
                            </FormControl>
                            <div className="grid gap-1.5 leading-none">
                              <Label
                                htmlFor={checkboxId}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                              >
                                {category.name}
                              </Label>
                              {category.description && (
                                <p className="text-sm text-muted-foreground">
                                  {category.description}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                        {!isLoadingCategories && !isErrorCategories && filteredFetchedCategories.length === 0 && categorySearch && (
                           <p className="text-sm text-muted-foreground">No categories found matching "{categorySearch}".</p>
                        )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
            </CardContent>
          </Card>
        </form>
      </Form>
    </div>
  );
};

export default CreateErrorCodePage; 