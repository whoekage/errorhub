import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

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

export const languages = ['kk', 'kg', 'uz', 'ru', 'en'] as const;

export const categoriesData = [
  'Authentication',
  'Authorization',
  'Validation',
  'Server',
  'Database',
  'External API',
  'Business Logic',
  // Adding more for scroll testing
  'User Interface',
  'Performance',
  'Security',
  'Logging',
  'Configuration',
  'Deployment',
  'Third-Party Integrations'
];

const translationSchema = z.object(
  Object.fromEntries(
    languages.map(lang => [lang, z.string().optional()])
  )
).refine(translations => {
  return languages.some(lang => translations[lang] && translations[lang]!.trim() !== '');
}, {
  message: "At least one translation is required.",
  path: ["translations"], // Specify path for refine error to appear at a general level if desired
});

export const createErrorCodeSchema = z.object({
  code: z.string().min(1, { message: "Error Code is required." }),
  translations: translationSchema,
  selectedCategories: z.array(z.string()).min(1, { message: "At least one category must be selected to publish." }),
});

export type CreateErrorCodeFormValues = z.infer<typeof createErrorCodeSchema>;

export const defaultValues: CreateErrorCodeFormValues = {
  code: '',
  translations: {
    ru: '',
    kk: '',
    kg: '',
    uz: '',
    en: '',
  },
  selectedCategories: [],
};

const CreateErrorCodePage: React.FC = () => {
  const form = useForm<CreateErrorCodeFormValues>({
    resolver: zodResolver(createErrorCodeSchema),
    defaultValues: defaultValues,
  });

  const { control, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = form;

  const onSubmit = (data: CreateErrorCodeFormValues) => {
    console.log('Form submitted:', data);
    return new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API call
  };

  // State for category search filter
  const [categorySearch, setCategorySearch] = useState('');

  // Watch the selected categories to display chips
  const selectedCategories = watch('selectedCategories');

  // Filter categories based on search term
  const filteredCategories = categoriesData.filter(category => 
    category.toLowerCase().includes(categorySearch.toLowerCase())
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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Create New Error Code</h1>
        <Button type="submit" form="create-error-code-form" disabled={isSubmitting}>
          {isSubmitting ? 'Publishing...' : 'Publish Error Code'}
        </Button>
      </div>
      <Form {...form}>
        <form id="create-error-code-form" onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Column 1 & 2: Create Error Form (Card) */}
          <Card className="md:col-span-2">
            <CardHeader><CardTitle>Create Error</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <FormField control={control} name="code" render={({ field }) => ( <FormItem> <FormLabel>Error Code*</FormLabel> <FormControl><Input placeholder="e.g., AUTH.01" {...field} /></FormControl> <FormDescription>Unique code for the error.</FormDescription> <FormMessage /> </FormItem> )}/>
              {languages.map((lang) => (
                <FormField key={lang} control={control} name={`translations.${lang}`} render={({ field }) => ( <FormItem> <FormLabel>Translation: {lang.toUpperCase()}</FormLabel> <FormControl><Textarea placeholder={`Enter translation for ${lang.toUpperCase()}`} {...field} value={field.value || ''} /></FormControl> <FormMessage /> </FormItem> )}/>
              ))}
              {errors.translations && typeof errors.translations.message === 'string' && (
                 <p className="text-sm font-medium text-destructive">{errors.translations.message}</p>
              )}
            </CardContent>
          </Card>

          {/* Column 3: Publish (Category Selection) */}
          <Card className="md:col-span-1">
            <CardHeader><CardTitle>Select Categories*</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {/* Selected Categories Chips */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Selected:</Label>
                <div className="flex flex-wrap gap-1 min-h-[40px] rounded-md border border-input bg-background p-2">
                    {selectedCategories?.length === 0 && <span className="text-xs text-muted-foreground">No categories selected</span>}
                    {selectedCategories?.map((category) => (
                        <Badge key={category} variant="secondary">
                            {category}
                            <button 
                                type="button" 
                                className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                onClick={() => removeCategory(category)}
                            >
                                <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                            </button>
                        </Badge>
                    ))}
                </div>
              </div>

              {/* Search Input */}
              <div className="space-y-2">
                <Label htmlFor="category-search">Search Categories</Label>
                <Input 
                  id="category-search"
                  placeholder="Search..."
                  value={categorySearch}
                  onChange={(e) => setCategorySearch(e.target.value)}
                />
              </div>
              
              {/* Category Checkbox List (No ScrollArea) */}
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
                              <Checkbox
                                checked={field.value?.includes(category)}
                                onCheckedChange={(checked) => {
                                  const currentValues = field.value || [];
                                  if (checked) {
                                    setValue('selectedCategories', [...currentValues, category], { shouldValidate: true });
                                  } else {
                                    setValue('selectedCategories', currentValues.filter(value => value !== category), { shouldValidate: true });
                                  }
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal cursor-pointer">
                              {category}
                            </FormLabel>
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

export default CreateErrorCodePage; 