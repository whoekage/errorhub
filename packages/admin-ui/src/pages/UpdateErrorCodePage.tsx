import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Badge } from "@/components/ui/badge";
import { X, Trash2 } from "lucide-react"; // Added Trash2 for delete button
import { Label } from "@/components/ui/label";

// Assuming these are defined and exported from a shared location or CreateErrorCodePage.tsx
// For now, redefine them here or we can centralize later.
export const languages = ['kk', 'kg', 'uz', 'ru', 'en'] as const;
export const categoriesData = [
  'Authentication', 'Authorization', 'Validation', 'Server', 'Database',
  'External API', 'Business Logic', 'User Interface', 'Performance', 'Security',
  'Logging', 'Configuration', 'Deployment', 'Third-Party Integrations'
];

const translationSchema = z.object(
  Object.fromEntries(
    languages.map(lang => [lang, z.string().optional()])
  )
).refine(translations => {
  return languages.some(lang => translations[lang] && translations[lang]!.trim() !== '');
}, {
  message: "At least one translation is required.",
  path: ["translations"], 
});

export const updateErrorCodeSchema = z.object({
  code: z.string().min(1, { message: "Error Code is required." }), // Code might be non-editable in updates, but schema needs it
  translations: translationSchema,
  selectedCategories: z.array(z.string()).min(1, { message: "At least one category must be selected to publish." }),
});

export type UpdateErrorCodeFormValues = z.infer<typeof updateErrorCodeSchema>;

// Mock data - in a real app, this would come from a store/API or be passed around
// We'll use the dummyErrors from ErrorListPage for now for simplicity in finding an item.
const allMockErrors = Array.from({ length: 35 }, (_, i) => ({
    id: (i + 1).toString(),
    code: `CODE.SUB.${String(i + 1).padStart(3, '0')}`,
    description: `This is a detailed description for error number ${i + 1}.`,
    translations: {
        en: `English description for CODE.SUB.${String(i + 1).padStart(3, '0')}`,
        ru: `Русское описание для CODE.SUB.${String(i + 1).padStart(3, '0')}`,
        // Add other languages if needed for mock
    },
    categories: i % 3 === 0 ? ['General', 'System'] : i % 2 === 0 ? ['User', 'Input'] : ['Data', 'Backend'],
  }));

const UpdateErrorCodePage: React.FC = () => {
  const { errorCodeParam } = useParams<{ errorCodeParam: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [errorNotFound, setErrorNotFound] = useState(false);

  const form = useForm<UpdateErrorCodeFormValues>({
    resolver: zodResolver(updateErrorCodeSchema),
    // defaultValues will be set by useEffect after fetching data
  });

  const { control, handleSubmit, setValue, watch, reset, formState: { errors, isSubmitting } } = form;

  useEffect(() => {
    if (errorCodeParam) {
      console.log("Fetching data for code:", errorCodeParam);
      // Simulate API call to fetch error details
      setIsLoading(true);
      setTimeout(() => {
        const existingError = allMockErrors.find(err => err.code === errorCodeParam);
        if (existingError) {
          const defaultValues: UpdateErrorCodeFormValues = {
            code: existingError.code,
            translations: languages.reduce((acc, lang) => {
                acc[lang] = existingError.translations[lang as keyof typeof existingError.translations] || '';
                return acc;
            }, {} as Record<typeof languages[number], string>),
            selectedCategories: existingError.categories || [],
          };
          reset(defaultValues); // Use reset to populate the form
          setErrorNotFound(false);
        } else {
          setErrorNotFound(true);
        }
        setIsLoading(false);
      }, 500);
    }
  }, [errorCodeParam, reset]);

  const onSubmit = (data: UpdateErrorCodeFormValues) => {
    console.log('Update submitted:', data);
    // Simulate API call
    return new Promise((resolve) => {
        setTimeout(() => {
            console.log('Successfully updated error code:', data.code);
            navigate('/errors'); // Navigate back to list after update
            resolve(true);
        }, 1000);
    });
  };

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete error code ${errorCodeParam}?`)) {
      console.log('Deleting error code:', errorCodeParam);
      // Simulate API call for delete
      // After successful deletion:
      navigate('/errors');
    }
  };
  
  const [categorySearch, setCategorySearch] = useState('');
  const selectedCategories = watch('selectedCategories');
  const filteredCategories = categoriesData.filter(category => 
    category.toLowerCase().includes(categorySearch.toLowerCase())
  );
  const removeCategory = (categoryToRemove: string) => {
    const currentValues = selectedCategories || [];
    setValue('selectedCategories', currentValues.filter(value => value !== categoryToRemove), { shouldValidate: true });
  };

  if (isLoading) {
    return <div className="container mx-auto p-4 text-center">Loading error details...</div>;
  }

  if (errorNotFound) {
    return <div className="container mx-auto p-4 text-center text-red-500">Error code {errorCodeParam} not found. <Link to="/errors" className="underline">Go back to list</Link></div>;
  }

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Update Error Code: <span className="text-primary">{errorCodeParam}</span></h1>
        <div className="flex gap-2">
            <Button type="submit" form="update-error-code-form" disabled={isSubmitting} >
            {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isSubmitting}>
                <Trash2 className="mr-2 h-4 w-4" /> Delete
            </Button>
        </div>
      </div>
      <Form {...form}>
        <form id="update-error-code-form" onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-2">
            <CardHeader><CardTitle>Error Details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <FormField control={control} name="code" render={({ field }) => ( <FormItem> <FormLabel>Error Code* (Read-only)</FormLabel> <FormControl><Input placeholder="e.g., AUTH.01" {...field} readOnly className="bg-muted/50" /></FormControl> <FormDescription>Unique code for the error. Cannot be changed.</FormDescription> <FormMessage /> </FormItem> )}/>
              {languages.map((lang) => (
                <FormField key={lang} control={control} name={`translations.${lang}`} render={({ field }) => ( <FormItem> <FormLabel>Translation: {lang.toUpperCase()}</FormLabel> <FormControl><Textarea placeholder={`Enter translation for ${lang.toUpperCase()}`} {...field} value={field.value || ''} /></FormControl> <FormMessage /> </FormItem> )}/>
              ))}
              {errors.translations && typeof errors.translations.message === 'string' && (
                 <p className="text-sm font-medium text-destructive">{errors.translations.message}</p>
              )}
            </CardContent>
          </Card>

          <Card className="md:col-span-1">
            <CardHeader><CardTitle>Select Categories*</CardTitle></CardHeader>
            <CardContent className="space-y-4">
            <div className="space-y-2">
                <Label className="text-sm font-medium">Selected:</Label>
                <div className="flex flex-wrap gap-1 min-h-[40px] rounded-md border border-input bg-background p-2">
                    {selectedCategories?.length === 0 && <span className="text-xs text-muted-foreground">No categories selected</span>}
                    {selectedCategories?.map((category) => (
                        <Badge key={category} variant="secondary">
                            {category}
                            <button type="button" className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2" onClick={() => removeCategory(category)}>
                                <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                            </button>
                        </Badge>
                    ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="category-search">Search Categories</Label>
                <Input id="category-search" placeholder="Search..." value={categorySearch} onChange={(e) => setCategorySearch(e.target.value)} />
              </div>
               <FormField
                  control={control}
                  name="selectedCategories"
                  render={({ field }) => (
                    <FormItem className="mt-4 border rounded-md p-4">
                      <div className="mb-4">
                          <FormLabel className="text-base font-semibold">Available Categories</FormLabel>
                      </div>
                        {filteredCategories.map((category) => (
                          <FormItem key={`pub-cat-${category}`} className="flex flex-row items-center space-x-3 space-y-0 mb-2">
                            <FormControl>
                              <Checkbox checked={field.value?.includes(category)} onCheckedChange={(checked) => { const currentValues = field.value || []; if (checked) { setValue('selectedCategories', [...currentValues, category], { shouldValidate: true }); } else { setValue('selectedCategories', currentValues.filter(value => value !== category), { shouldValidate: true }); } }} />
                            </FormControl>
                            <FormLabel className="font-normal cursor-pointer">{category}</FormLabel>
                          </FormItem>
                        ))}
                        {filteredCategories.length === 0 && categorySearch && (
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

export default UpdateErrorCodePage; 