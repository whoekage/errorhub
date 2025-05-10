import React, { useState, useEffect, useMemo } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Search } from "lucide-react"; // Keep Search, PlusCircle
import { Input } from "@/components/ui/input";
// Removed Button from here as it's not used for individual cards now, but might be needed for "Create New" if it's a button and not a card.
// For now, "Create New" is a Card.

// Define the ErrorItem interface based on typical error data
export interface ErrorItem {
  id: string;
  code: string;
  message: string; // Or description
  // category?: string; // Optional: if you want to show category on the card
  createdAt: string; // Expecting ISO string date
  // createdBy?: string; // Will be hardcoded for now
}

// Mock data for errors
const mockErrors: ErrorItem[] = Array.from({ length: 18 }, (_, i) => ({
  id: `err-${i + 1}`,
  code: i % 4 === 0 ? `AUTH.SESSION.EXPIRED_${i}` :
        i % 4 === 1 ? `PAYMENT.CARD.DECLINED_${i}` :
        i % 4 === 2 ? `USER.PROFILE.NOT_FOUND_${i}` :
                      `API.EXTERNAL_SERVICE.TIMEOUT_${i}`,
  message: `This is a sample error message for ${i + 1}. It explains what went wrong and potentially how to resolve it.`,
  // category: i % 2 === 0 ? 'Authentication' : 'User Management',
  createdAt: new Date(Date.now() - Math.random() * 10000000000).toISOString(), // Random past date
}));

// Debounce function (copied from CategoriesPage)
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

const ErrorListPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  // Debounce effect for search term
  useEffect(() => {
    const debouncedSetter = debounce(setDebouncedSearchTerm, 300);
    debouncedSetter(searchTerm);
    // Basic cleanup (more advanced might involve cancelling the debounce)
    return () => {
      // This is a simplified cleanup. For a robust solution, the debounce function would return a cancel method.
    };
  }, [searchTerm]);

  // Filtered errors based on debounced search term (client-side for mock data)
  const filteredErrors = useMemo(() => {
    if (!debouncedSearchTerm) {
      return mockErrors;
    }
    return mockErrors.filter(
      (error) =>
        error.code.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        error.message.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
    );
  }, [debouncedSearchTerm]);
  
  // const navigate = useNavigate(); // Import if needed for navigation

  return (
    <div className="container mx-auto p-4 lg:p-6 max-w-7xl">
      {/* Hero-блок */}
      <Card className="mb-8 bg-background/80 shadow-none border-0 rounded-2xl">
        <CardHeader>
          <CardTitle className="text-4xl font-extrabold tracking-tight text-white mb-2">
            Error Code Management
          </CardTitle>
          <div className="text-lg font-semibold text-white/80 mb-1">
            Visually manage and organize your application's error codes.
          </div>
          <div className="text-base text-white/70">
            Create, view, and search for error codes. This central hub helps standardize error handling and improves debugging.
          </div>
        </CardHeader>
      </Card>

      {/* Search Input */}
      <div className="mb-6 relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search by error code or message..."
          className="pl-8 w-full md:w-1/3 shadow-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Grid карточек */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
        {/* Карточка создания нового Error Code */}
        <Card
          className="flex flex-col items-center justify-center h-40 cursor-pointer hover:bg-muted/50 transition border-dashed border-2 hover:border-primary"
          onClick={() => { /* navigate('/errors/new'); */ console.log('Create new error code') }}
        >
          <PlusCircle className="w-10 h-10 text-primary mb-2" />
          <div className="font-semibold text-lg">New Error Code</div>
        </Card>

        {/* Существующие Error Codes */}
        {filteredErrors.length > 0 ? (
          filteredErrors.map((error: ErrorItem) => (
            <Card key={error.id} className="relative group h-40 flex flex-col justify-between p-4 shadow-sm hover:shadow-lg transition-shadow">
              <div>
                <div className="text-lg font-bold mb-1 truncate" title={error.code}>{error.code}</div>
                <div className="text-sm text-muted-foreground mb-2 truncate h-10" title={error.message}>{error.message}</div>
              </div>
              <div className="mt-auto text-xs text-muted-foreground">
                <div>Created: {new Date(error.createdAt).toLocaleDateString()}</div>
                <div>By: @whoekage</div> {/* Hardcoded as requested */}
              </div>
              {/* Optional: Display category or other info as a badge if needed
              {error.category && (
                <div className="absolute top-3 right-3 text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full">
                  {error.category}
                </div>
              )}
              */}
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-10">
            <p className="text-lg text-muted-foreground">No error codes found matching your search.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ErrorListPage; 