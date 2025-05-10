import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { getCategories, type Category } from "@/api/categoryService"; // Assuming this path and Category type

// Define a more specific type for the API response if needed, e.g.:
interface CategoryListResponse {
  data: Category[];
  // meta?: any; // Add if meta data is used
  // links?: any; // Add if links are used
}

// Debounce function
function debounce<F extends (...args: any[]) => any>(func: F, waitFor: number) {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  const debounced = (...args: Parameters<F>) => {
    if (timeout !== null) {
      clearTimeout(timeout);
      timeout = null;
    }
    timeout = setTimeout(() => func(...args), waitFor);
  };

  return debounced as (...args: Parameters<F>) => ReturnType<F>;
}

const CategoriesPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  const { data: apiResponse, isLoading, isError, error } = useQuery<CategoryListResponse, Error>({
    // Include debouncedSearchTerm in the queryKey to trigger refetch
    queryKey: ['categories', debouncedSearchTerm],
    // Pass search term to getCategories
    queryFn: () => getCategories({ search: debouncedSearchTerm || undefined }), 
  });

  // const navigate = useNavigate(); // Раскомментируй, если будешь использовать navigate

  // Debounce effect for search term
  useEffect(() => {
    const debouncedSetter = debounce(setDebouncedSearchTerm, 300);
    debouncedSetter(searchTerm);

    // Cleanup function to clear timeout if component unmounts or searchTerm changes quickly
    return () => {
      if (debouncedSetter) {
        // How to properly clear/cancel a debounced function like this depends on its implementation.
        // If it returns a cancel method, call it here.
        // For this simple debounce, clearing the timeout is handled within the debounce function itself on subsequent calls.
      }
    };
  }, [searchTerm]);

  if (isLoading && !apiResponse) { // Show loading only on initial load or when search results are not yet available
    return <div className="container mx-auto p-4 lg:p-6 max-w-7xl text-center">Loading categories...</div>;
  }

  if (isError) {
    return <div className="container mx-auto p-4 lg:p-6 max-w-7xl text-center text-red-500">Error loading categories: {error?.message}</div>;
  }

  // Extract categories array from the response, default to empty array if no data
  const categories: Category[] = apiResponse?.data || [];

  return (
    <div className="container mx-auto p-4 lg:p-6 max-w-7xl">
      {/* Hero-блок */}
      <Card className="mb-8 bg-background/80 shadow-none border-0 rounded-2xl">
        <CardHeader>
          <CardTitle className="text-4xl font-extrabold tracking-tight text-white mb-2">
            Category Management
          </CardTitle>
          <div className="text-lg font-semibold text-white/80 mb-1">
            Manage your error categories visually
          </div>
          <div className="text-base text-white/70">
            Create, edit, and organize error categories for your project. Categories help you group and filter error codes for better management and reporting.
          </div>
        </CardHeader>
      </Card>

      {/* Search Input */}
      <div className="mb-6 relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search categories by name or description..."
          className="pl-8 w-full md:w-1/3 shadow-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Grid карточек */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
        {/* Карточка создания */}
        <Card
          className="flex flex-col items-center justify-center h-40 cursor-pointer hover:bg-muted/50 transition border-dashed border-2 hover:border-primary"
          onClick={() => { /* navigate('/categories/new'); */ console.log('Create new category') }}
        >
          <PlusCircle className="w-10 h-10 text-primary mb-2" />
          <div className="font-semibold text-lg">New Category</div>
        </Card>

        {/* Существующие категории */}
        {categories.length > 0 ? (
          categories.map((cat: Category) => (
            <Card key={cat.id} className="relative group h-40 flex flex-col justify-between p-4 shadow-sm hover:shadow-lg transition-shadow">
              <div>
                <div className="text-xl font-bold mb-1 truncate" title={cat.name}>{cat.name}</div>
                <div className="text-sm text-muted-foreground mb-2 truncate" title={cat.description}>{cat.description}</div>
              </div>
              <div className="mt-auto text-xs text-muted-foreground">
                <div>Created: {new Date(cat.createdAt).toLocaleDateString()}</div>
                <div>By: @whoekage</div>
              </div>
              {/* <div className="absolute top-3 right-3 text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full">
                {cat.errorCount || 0} errors
              </div> */}
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-10">
            <p className="text-lg text-muted-foreground">No categories found.</p>
            {/* Optionally, suggest creating one if the list is empty */}
            {/* <p>Get started by creating a new category!</p> */}
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoriesPage; 