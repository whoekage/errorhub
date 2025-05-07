import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  MoreHorizontal,
  PlusCircle,
  Search,
  Filter,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

interface ErrorItem {
    id: string;
    code: string;
    description: string;
    categories: string[];
}

// Expanded Dummy data for initial display
const dummyErrors: ErrorItem[] = Array.from({ length: 35 }, (_, i) => ({
  id: (i + 1).toString(),
  code: `CODE.SUB.${String(i + 1).padStart(3, '0')}`,
  description: `This is a detailed description for error number ${i + 1}. It might involve several components and user actions leading to this specific state. Example text to make it longer than the code itself. `,
  categories: i % 3 === 0 ? ['General', 'System'] : i % 2 === 0 ? ['User', 'Input'] : ['Data', 'Backend'],
}));

const ITEMS_PER_PAGE_OPTIONS = [5, 10, 20, 50];

const ErrorListPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(ITEMS_PER_PAGE_OPTIONS[1]); // Default to 10
  const [currentErrorList, setCurrentErrorList] = useState<ErrorItem[]>(dummyErrors);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [errorToDelete, setErrorToDelete] = useState<ErrorItem | null>(null);

  // Filter errors based on search term
  const filteredErrors = currentErrorList.filter(error =>
    error.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    error.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate pagination
  const totalPages = Math.ceil(filteredErrors.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredErrors.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  const handleEdit = (errorCode: string) => {
    navigate(`/errors/edit/${errorCode}`);
  };

  const openDeleteDialog = (error: ErrorItem) => {
    setErrorToDelete(error);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!errorToDelete) return;
    console.log('Deleting error code:', errorToDelete.code, 'with ID:', errorToDelete.id);
    // Simulate API call for delete
    // To reflect in UI without real API:
    // setCurrentErrorList(prev => prev.filter(err => err.id !== errorToDelete.id));
    // setCurrentPage(1); // Reset to page 1 or adjust as needed
    // if (currentItems.length === 1 && currentPage > 1) { setCurrentPage(currentPage -1); }
    setIsDeleteDialogOpen(false);
    setErrorToDelete(null);
  };

  const renderPageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5; // Max page numbers to show (e.g., 1 2 ... 5 6 or 1 ... 4 5 6)
    const halfMaxPages = Math.floor(maxPagesToShow / 2);

    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(
          <PaginationItem key={i}>
            <PaginationLink href="#" onClick={(e) => { e.preventDefault(); handlePageChange(i); }} isActive={currentPage === i}>
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }
    } else {
      // Show first page
      pageNumbers.push(
        <PaginationItem key={1}>
          <PaginationLink href="#" onClick={(e) => { e.preventDefault(); handlePageChange(1); }} isActive={currentPage === 1}>
            1
          </PaginationLink>
        </PaginationItem>
      );

      // Ellipsis after first page if needed
      if (currentPage > halfMaxPages + 1) {
        pageNumbers.push(<PaginationEllipsis key="start-ellipsis" />);
      }

      // Middle pages
      let startPage = Math.max(2, currentPage - halfMaxPages + (totalPages - currentPage < halfMaxPages ? halfMaxPages - (totalPages - currentPage) : 1) );
      let endPage = Math.min(totalPages - 1, currentPage + halfMaxPages - (currentPage <= halfMaxPages ? halfMaxPages - currentPage +1 : 1));
      
      // Adjust if calculated range is too small
      if (currentPage <= halfMaxPages) {
        endPage = Math.min(totalPages-1, maxPagesToShow-2); 
      } 
      if (totalPages - currentPage < halfMaxPages) {
        startPage = Math.max(2, totalPages - maxPagesToShow + 3);
      }

      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(
          <PaginationItem key={i}>
            <PaginationLink href="#" onClick={(e) => { e.preventDefault(); handlePageChange(i); }} isActive={currentPage === i}>
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }

      // Ellipsis before last page if needed
      if (currentPage < totalPages - halfMaxPages) {
        pageNumbers.push(<PaginationEllipsis key="end-ellipsis" />);
      }

      // Show last page
      pageNumbers.push(
        <PaginationItem key={totalPages}>
          <PaginationLink href="#" onClick={(e) => { e.preventDefault(); handlePageChange(totalPages); }} isActive={currentPage === totalPages}>
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }
    return pageNumbers;
  };

  return (
    <>
    <div className="container mx-auto p-4 lg:p-6 max-w-7xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Error Codes</h1>
          <p className="text-muted-foreground">
            Showing {Math.min(startIndex + 1, filteredErrors.length)} - {Math.min(endIndex, filteredErrors.length)} of {filteredErrors.length} entries
          </p>
        </div>
        <Link to="/errors/new">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" /> Create New Error Code
          </Button>
        </Link>
      </div>

      <div className="flex items-center justify-between mb-4 gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search by code or description..."
            className="pl-8 w-full md:w-1/3"
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1);}} // Reset to page 1 on search
          />
        </div>
        <Button variant="outline">
          <Filter className="mr-2 h-4 w-4" /> Filters
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px] py-3 px-4">ID</TableHead>
              <TableHead className="w-[250px] py-3 px-4">Error Code</TableHead>
              <TableHead className="py-3 px-4">Description (EN)</TableHead>
              <TableHead className="w-[200px] py-3 px-4">Categories</TableHead>
              <TableHead className="w-[100px] text-right py-3 px-4">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentItems.length > 0 ? (
              currentItems.map((error) => (
                <TableRow key={error.id}>
                  <TableCell className="font-medium py-3 px-4">{error.id}</TableCell>
                  <TableCell className="font-medium py-3 px-4">{error.code}</TableCell>
                  <TableCell className="py-3 px-4">{error.description}</TableCell>
                  <TableCell className="py-3 px-4">
                    <div className="flex flex-wrap gap-1">
                      {error.categories.map(category => (
                        <span key={category} className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                          {category}
                        </span>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-right py-3 px-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(error.code)}>Edit</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openDeleteDialog(error)} className="text-red-600 hover:text-red-600 hover:bg-red-50">Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center py-3 px-4">
                  No results found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
         <div className="flex items-center justify-between mt-4">
            <div>
                <Select
                    value={itemsPerPage.toString()}
                    onValueChange={(value) => {
                        setItemsPerPage(Number(value));
                        setCurrentPage(1); // Reset to first page when items per page changes
                    }}
                >
                    <SelectTrigger className="w-[100px]">
                        <SelectValue placeholder="Per page" />
                    </SelectTrigger>
                    <SelectContent>
                        {ITEMS_PER_PAGE_OPTIONS.map(option => (
                            <SelectItem key={option} value={option.toString()}>
                                {option} / page
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious href="#" onClick={(e) => { e.preventDefault(); handlePreviousPage(); }} disabled={currentPage === 1} />
                </PaginationItem>
                {renderPageNumbers()}
                <PaginationItem>
                  <PaginationNext href="#" onClick={(e) => { e.preventDefault(); handleNextPage(); }} disabled={currentPage === totalPages} />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
        </div>
      )}
    </div>

    {errorToDelete && (
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the error code <span className="font-semibold text-foreground">{errorToDelete.code}</span>.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setErrorToDelete(null)}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete
                </AlertDialogAction>
            </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )}
    </>
  );
};

export default ErrorListPage; 