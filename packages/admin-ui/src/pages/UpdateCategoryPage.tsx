import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/Button';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { getCategory, updateCategory, deleteCategory, Category } from '@/api/categoryService';
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  description: z.string().max(500, 'Description must be at most 500 characters').optional(),
});
type CategoryFormValues = z.infer<typeof categorySchema>;

const UpdateCategoryPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [category, setCategory] = useState<Category | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: '', description: '' },
  });
  const { reset, handleSubmit, control } = form;

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    getCategory(Number(id))
      .then((cat) => {
        if (!cat) {
          setNotFound(true);
        } else {
          setCategory(cat);
          reset({ name: cat.name, description: cat.description || '' });
        }
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setIsLoading(false));
  }, [id, reset]);

  const onSubmit = async (data: CategoryFormValues) => {
    if (!id) return;
    setIsSaving(true);
    setError(null);
    try {
      await updateCategory(Number(id), data);
      navigate('/categories');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!category) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await deleteCategory(category.id);
      navigate('/categories');
    } catch (e: unknown) {
      setDeleteError(e instanceof Error ? e.message : String(e));
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) return <div className="container mx-auto p-4 text-center">Loading category...</div>;
  if (notFound) return <div className="container mx-auto p-4 text-center text-red-500">Category not found. <Link to="/categories" className="underline">Go back</Link></div>;

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">Back</Button>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Edit Category</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form id="update-category-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <FormField control={control} name="name" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={control} name="description" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  {error && <div className="text-red-500 text-sm">{error}</div>}
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
        {/* Metadata Card + Actions */}
        {category && (
          <div className="flex flex-col gap-4">
            {/* Actions row */}
            <div className="flex justify-between items-center">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" disabled={isDeleting}>Delete</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Category</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this category? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  {deleteError && <div className="text-red-500 text-sm">{deleteError}</div>}
                  <AlertDialogFooter>
                    <AlertDialogCancel asChild>
                      <Button variant="outline" disabled={isDeleting}>Cancel</Button>
                    </AlertDialogCancel>
                    <AlertDialogAction asChild>
                      <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                        {isDeleting ? 'Deleting...' : 'Delete'}
                      </Button>
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <Button type="submit" form="update-category-form" disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
            <Card>
              <CardHeader>
                <CardTitle>Metadata</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <span className="font-medium">Created by:</span> sharkaev phail
                </div>
                <div>
                  <span className="font-medium">Created at:</span> {new Date(category.createdAt).toLocaleString()}
                </div>
                <div>
                  <span className="font-medium">Updated by:</span> sharkaev phail
                </div>
                <div>
                  <span className="font-medium">Updated at:</span> {new Date(category.updatedAt).toLocaleString()}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default UpdateCategoryPage; 