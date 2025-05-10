import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useQuery } from '@tanstack/react-query';
import { getCategories } from '@/api/categoryService';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import type { Category } from '@/api/categoryService';

const CategoriesPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const {
    data,
    isLoading,
    isError,
    error,
  } = useQuery<{ data: Category[] }, Error>({
    queryKey: ['categories', searchTerm],
    queryFn: () => getCategories(searchTerm ? { search: searchTerm } : undefined),
  });

  const categories: Category[] = useMemo(() => data?.data ?? [], [data]);

  return (
    <div className="container mx-auto p-4 lg:p-6 max-w-3xl">
      <h1 className="text-3xl font-bold mb-6">Category Management</h1>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              type="search"
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mb-4"
            />
            {isLoading ? (
              <div>Loading categories...</div>
            ) : isError ? (
              <div className="text-red-500">Error: {(error as Error)?.message}</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Updated</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.length > 0 ? (
                    categories.map((cat: Category) => (
                      <TableRow
                        key={cat.id}
                        className="hover:bg-muted/50 cursor-pointer"
                        tabIndex={0}
                        role="button"
                        aria-label={`Edit category ${cat.name}`}
                        onClick={() => navigate(`/categories/edit/${cat.id}`)}
                        onKeyDown={e => {
                          if (e.key === 'Enter' || e.key === ' ') navigate(`/categories/edit/${cat.id}`);
                        }}
                      >
                        <TableCell>{cat.name}</TableCell>
                        <TableCell>{cat.description || <span className="text-muted-foreground italic">No description</span>}</TableCell>
                        <TableCell>{new Date(cat.createdAt).toLocaleString()}</TableCell>
                        <TableCell>{new Date(cat.updatedAt).toLocaleString()}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground italic">No categories found.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CategoriesPage; 