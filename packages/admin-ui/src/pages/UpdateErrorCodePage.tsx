import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getErrorCodeById, type CreatedErrorCodeAPIResponse, createErrorCodeAPI as updateErrorCodeAPI, type CreateErrorCodeAPIPayload as UpdateErrorCodeAPIPayload } from '@/api/errorService';
import { getCategories, type Category, type CategoryListResponse } from '@/api/categoryService';
import { getEnabledLanguages } from '@/api/languageService';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Badge } from "@/components/ui/badge";
import { X, Trash2, CalendarDays, Save } from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ErrorStatsCard } from '@/components/ErrorStatsCard';
import { useToast } from "@/hooks/use-toast";

export const allPossibleLanguages = ['kk', 'kg', 'uz', 'ru', 'en'] as const;
type LanguageCode = typeof allPossibleLanguages[number];

const languageDisplayNames: Record<LanguageCode | string, string> = {
  kk: 'Kazakh',
  kg: 'Kyrgyz',
  uz: 'Uzbek',
  ru: 'Russian',
  en: 'English'
};

const translationSchema = z.object(
  Object.fromEntries(
    allPossibleLanguages.map(lang => [lang, z.string().optional()])
  ) as Record<LanguageCode, z.ZodOptional<z.ZodString>>
).refine(_translations => {
  return true;
}, {
  message: "At least one translation is required if any are provided.",
  path: ["translations"],
});

export const updateErrorCodeFormSchema = z.object({
  code: z.string(),
  translations: translationSchema,
  selectedCategories: z.array(z.string()),
  context: z.string().optional(),
  status: z.enum(['draft', 'published', 'archived']),
});

export type UpdateErrorCodeFormValues = z.infer<typeof updateErrorCodeFormSchema>;

interface MetaInfo {
    createdAt?: string;
    updatedAt?: string;
}

const UpdateErrorCodePage: React.FC = () => {
  const { id: idFromParams } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [metaInfo, setMetaInfo] = useState<MetaInfo | null>(null);
  const [categorySearch, setCategorySearch] = useState('');

  const numericId = idFromParams ? parseInt(idFromParams, 10) : undefined;

  const form = useForm<UpdateErrorCodeFormValues>({
    resolver: zodResolver(updateErrorCodeFormSchema),
  });

  const { control, handleSubmit, setValue, watch, reset, setError, formState: { errors, isSubmitting: isFormSubmitting } } = form;

  const { 
    data: errorCodeData, 
    isLoading: isLoadingErrorCode, 
    isError: isErrorErrorCode,
    error: errorCodeLoadingError 
  } = useQuery<CreatedErrorCodeAPIResponse, Error>({
    queryKey: ['errorCode', numericId],
    queryFn: () => {
      if (!numericId) throw new Error("Error code ID is missing");
      return getErrorCodeById(numericId);
    },
    enabled: !!numericId,
    retry: false,
  });

  const {
    data: categoriesResponse,
    isLoading: isLoadingCategories,
  } = useQuery<CategoryListResponse, Error>({
    queryKey: ['allCategoriesForUpdate'],
    queryFn: () => getCategories({ limit: 1000 }),
  });
  const allFetchedCategories: Category[] = categoriesResponse?.data || [];

  const {
    data: enabledLanguages = [],
    isLoading: isLoadingLanguages,
  } = useQuery<string[], Error>({
    queryKey: ['enabledLanguagesForUpdate'],
    queryFn: getEnabledLanguages,
  });

  useEffect(() => {
    if (errorCodeData) {
      const formValues: UpdateErrorCodeFormValues = {
        code: errorCodeData.code,
        translations: {},
        selectedCategories: errorCodeData.categories?.map(cat => cat.name) || [],
        context: errorCodeData.context || '',
        status: errorCodeData.status,
      };

      const currentTranslations: Record<string, string> = {};
      allPossibleLanguages.forEach(lang => {
        const foundTranslation = errorCodeData.translations?.find(t => t.language === lang);
        currentTranslations[lang] = foundTranslation ? foundTranslation.message : '';
      });
      formValues.translations = currentTranslations;

      reset(formValues);

      setMetaInfo({
        createdAt: errorCodeData.createdAt ? new Date(errorCodeData.createdAt).toLocaleString() : 'N/A',
        updatedAt: errorCodeData.updatedAt ? new Date(errorCodeData.updatedAt).toLocaleString() : 'N/A',
      });
    }
  }, [errorCodeData, reset]);
  
  const updateMutation = useMutation({
    mutationFn: (data: UpdateErrorCodeAPIPayload) => {
      if (!numericId) throw new Error("Missing ID for update");
      return updateErrorCodeAPI(numericId, data);
    },
    onSuccess: (updatedData: CreatedErrorCodeAPIResponse) => {
      toast({ title: "Success", description: `Error code ${updatedData.code} updated successfully!`});
      queryClient.invalidateQueries({ queryKey: ['errorCode', numericId] });
      queryClient.invalidateQueries({ queryKey: ['errorCodesList'] });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Error", description: `Failed to update error code: ${error.message}`});
      setError("root.serverError", { type: "APIError", message: error.message });
    }
  });

  const onSubmit = (data: UpdateErrorCodeFormValues) => {
    console.log('Update submitted data:', data);
    if (!numericId) {
        toast({ variant: "destructive", title: "Error", description: "Error ID is missing, cannot update."});
        return;
    }

    const payload: UpdateErrorCodeAPIPayload = {
        translations: {},
        categoryIds: [],
        context: data.context || undefined,
        status: data.status,
    };
    
    const languagesToConsider: readonly LanguageCode[] = enabledLanguages.length > 0 ? enabledLanguages as LanguageCode[] : allPossibleLanguages;
    languagesToConsider.forEach(lang => {
        if (data.translations[lang] && data.translations[lang]!.trim() !== '') {
            payload.translations[lang] = data.translations[lang]!;
        }
    });

    if (allFetchedCategories && data.selectedCategories) {
        payload.categoryIds = data.selectedCategories
            .map(selectedName => {
                const foundCategory = allFetchedCategories.find(cat => cat.name === selectedName);
                return foundCategory ? foundCategory.id.toString() : undefined;
            })
            .filter((id): id is string => id !== undefined);
    }
    
    console.log('Payload to API:', payload);
    updateMutation.mutate(payload);
  };

  const confirmDelete = () => {
    console.log('Deleting error code ID:', numericId);
    toast({ title: "Info", description: `Deletion for ${numericId} (not implemented yet).` });
    setIsDeleteDialogOpen(false);
  };

  const selectedCategoriesWatched = watch('selectedCategories');

  const filteredSystemCategories = allFetchedCategories.filter(category =>
    category.name.toLowerCase().includes(categorySearch.toLowerCase())
  );

  const removeCategory = (categoryToRemove: string) => {
    const currentValues = selectedCategoriesWatched || [];
    setValue('selectedCategories',
             currentValues.filter(value => value !== categoryToRemove),
             { shouldValidate: true });
  };

  const isLoading = isLoadingErrorCode || isLoadingCategories || isLoadingLanguages;
  const isProcessing = isFormSubmitting || updateMutation.isPending;

  if (isLoading) {
    return <div className="container mx-auto p-4 text-center">Loading error details...</div>;
  }

  if (isErrorErrorCode || !errorCodeData) {
    const errorMsg = errorCodeLoadingError?.message || `Error code with ID ${numericId} not found.`;
    return (
      <div className="container mx-auto p-4 text-center text-destructive">
        {errorMsg} <Link to="/errors" className="underline">Go back to list</Link>
      </div>
    );
  }

  return (
    <>
      <div className="container mx-auto p-4 max-w-6xl">
        <div className="flex justify-between items-center mb-2">
          <h1 className="text-3xl font-bold">Update Error Message</h1>
        </div>
        <p className="text-sm text-muted-foreground mb-6">Modify the details of your error code. Fields with * are required.</p>

        <Form {...form}>
          <form id="update-error-code-form" onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Error Code: <span className="text-primary">{errorCodeData.code}</span></CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField control={control} name="code" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Error Identifier (Read-only)</FormLabel>
                    <FormControl><Input {...field} readOnly className="bg-muted/50" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}/>

                <FormField control={control} name="context" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Context (Optional)</FormLabel>
                    <FormControl><Textarea placeholder="Optional: Provide context for this error..." {...field} value={field.value || ''} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}/>
                
                <FormField control={control} name="status" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Status*</FormLabel>
                        <FormControl>
                            <select {...field} className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                                <option value="draft">Draft</option>
                                <option value="published">Published</option>
                                <option value="archived">Archived</option>
                            </select>
                        </FormControl>
                        <FormDescription>Set the current status of the error code.</FormDescription>
                        <FormMessage />
                    </FormItem>
                )}/>

                {isLoadingLanguages && <p>Loading language fields...</p>}
                {(enabledLanguages.length > 0 ? enabledLanguages : allPossibleLanguages).map((lang) => {
                    const langCode = lang as LanguageCode;
                    return (
                        <FormField
                            key={langCode}
                            control={control}
                            name={`translations.${langCode}`}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{languageDisplayNames[langCode] || langCode.toUpperCase()} Translation</FormLabel>
                                    <FormControl><Textarea placeholder={`Translation for ${languageDisplayNames[langCode] || langCode.toUpperCase()}`} {...field} value={field.value || ''} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
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

            <div className="md:col-span-1 space-y-6">
              {metaInfo && (
                <Card>
                  <CardHeader><CardTitle>Meta Information</CardTitle></CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="flex items-center"><CalendarDays className="h-4 w-4 mr-2 text-muted-foreground" /><span><span className="font-semibold">Created at:</span> {metaInfo.createdAt}</span></div>
                    <div className="flex items-center"><CalendarDays className="h-4 w-4 mr-2 text-muted-foreground" /><span><span className="font-semibold">Updated at:</span> {metaInfo.updatedAt}</span></div>
                    <div className="flex items-center"><CalendarDays className="h-4 w-4 mr-2 text-muted-foreground" /><span><span className="font-semibold">Current Status:</span> <Badge variant={errorCodeData.status === 'published' ? 'default' : errorCodeData.status === 'archived' ? 'outline' : 'secondary'}>{errorCodeData.status}</Badge></span></div>
                  </CardContent>
                </Card>
              )}

              {errorCodeData.code && <ErrorStatsCard errorCode={errorCodeData.code} />}

              <Card>
                <CardHeader><CardTitle>Categorize Your Error</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Selected:</Label>
                    <div className="flex flex-wrap gap-1 min-h-[40px] rounded-md border border-input bg-background p-2">
                      {selectedCategoriesWatched?.length === 0 && <span className="text-xs text-muted-foreground">No categories selected</span>}
                      {selectedCategoriesWatched?.map((categoryName) => (
                        <Badge key={categoryName} variant="secondary">
                          {categoryName}
                          <button type="button" className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2" onClick={() => removeCategory(categoryName)}>
                            <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                     {errors.selectedCategories && <p className="text-sm font-medium text-destructive">{errors.selectedCategories.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category-search-update">Find relevant categories</Label>
                    <Input id="category-search-update" placeholder="Search categories..." value={categorySearch} onChange={(e) => setCategorySearch(e.target.value)} disabled={isLoadingCategories} />
                  </div>

                  <FormField control={control} name="selectedCategories" render={({ field }) => (
                    <FormItem className="mt-4 border rounded-md p-4 space-y-2 max-h-60 overflow-y-auto">
                      <div className="mb-2"><FormLabel className="text-base font-semibold">Available Categories</FormLabel></div>
                      {isLoadingCategories && <p>Loading categories...</p>}
                      {!isLoadingCategories && allFetchedCategories.length === 0 && <p className="text-muted-foreground">No categories available.</p>}
                      {!isLoadingCategories && filteredSystemCategories.map((category) => (
                        <FormItem key={category.id} className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(category.name)}
                              onCheckedChange={(checked) => {
                                const currentValues = field.value || [];
                                setValue('selectedCategories',
                                  checked ? [...currentValues, category.name] : currentValues.filter(value => value !== category.name),
                                  { shouldValidate: true }
                                );
                              }}
                            />
                          </FormControl>
                          <Label htmlFor={`category-${category.id}`} className="font-normal cursor-pointer">{category.name}</Label>
                        </FormItem>
                      ))}
                      {!isLoadingCategories && filteredSystemCategories.length === 0 && categorySearch && (
                        <p className="text-sm text-muted-foreground">No categories found matching "{categorySearch}".</p>
                      )}
                    </FormItem>
                  )}/>
                </CardContent>
              </Card>

                <div className="flex flex-col space-y-2">
                    <Button type="submit" form="update-error-code-form" disabled={isProcessing}>
                        <Save className="mr-2 h-4 w-4" /> {isProcessing ? 'Saving...' : 'Save Changes'}
                    </Button>
                    <Button variant="destructive" onClick={() => setIsDeleteDialogOpen(true)} disabled={isProcessing}>
                        <Trash2 className="mr-2 h-4 w-4" /> Delete Error Code
                    </Button>
                    <Button variant="outline" onClick={() => navigate('/errors')} disabled={isProcessing}>
                        Cancel
                    </Button>
                </div>
            </div>
          </form>
        </Form>
      </div>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the error code
              <span className="font-semibold text-foreground"> {errorCodeData?.code}</span> and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default UpdateErrorCodePage; 