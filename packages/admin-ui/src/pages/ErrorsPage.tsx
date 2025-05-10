import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/Button";
import { MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
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
import { Link } from 'react-router-dom';
import {
  Card,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { ErrorData } from "@/types";

const mockErrors: ErrorData[] = [
  {
    id: "1",
    code: "USER.NOT_FOUND",
    message: "The requested user was not found in the system.",
    category: "User Management",
    createdAt: "2024-01-15",
  },
  {
    id: "2",
    code: "PAYMENT.FAILED",
    message: "The payment attempt failed due to insufficient funds.",
    category: "Billing",
    createdAt: "2024-01-16",
  },
  {
    id: "3",
    code: "API.UNAUTHORIZED",
    message: "Missing or invalid authentication token.",
    category: "API Security",
    createdAt: "2024-01-17",
  },
  {
    id: "4",
    code: "INPUT.VALIDATION_ERROR",
    message: "Provided input data is invalid. Please check the fields.",
    category: "General",
    createdAt: "2024-01-18",
  },
  {
    id: "5",
    code: "SERVICE.UNAVAILABLE",
    message: "The requested service is temporarily unavailable.",
    category: "System",
    createdAt: "2024-01-19",
  },
  {
    id: "6",
    code: "DB.CONNECTION_ERROR",
    message: "Failed to connect to the database.",
    category: "System",
    createdAt: "2024-01-20",
  },
  {
    id: "7",
    code: "FILE.NOT_FOUND",
    message: "The specified file could not be located.",
    category: "File System",
    createdAt: "2024-01-21",
  },
];

const ITEMS_PER_PAGE = 5;

export const ErrorsPage: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(mockErrors.length / ITEMS_PER_PAGE);
  const currentErrors = mockErrors.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );
  const handlePageChange = (page: number) => setCurrentPage(page);

  return (
    <div className="container mx-auto p-4 lg:p-6 max-w-3xl">
      {/* Hero-блок */}
      <Card className="mb-8 bg-background/80 shadow-none border-0 rounded-2xl">
        <CardHeader>
          <CardTitle className="text-4xl font-extrabold tracking-tight text-white mb-2">
            Error Management
          </CardTitle>
          <div className="text-lg font-semibold text-white/80 mb-1">
            Manage your error codes
          </div>
          <div className="text-base text-white/70">
            Create, edit, and organize error codes for your project. Error codes help you standardize and localize error handling across your application.
          </div>
        </CardHeader>
      </Card>

      {/* Section header and entries info */}
      <div className="flex justify-end mb-4">
        <Link to="/errors/new">
          <Button variant="secondary">Create New Error Code</Button>
        </Link>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[60px]">ID</TableHead>
              <TableHead className="w-[200px]">Error Code</TableHead>
              <TableHead>Description (EN)</TableHead>
              <TableHead className="w-[180px]">Categories</TableHead>
              <TableHead className="text-right w-[80px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentErrors.map((error, idx) => (
              <TableRow key={error.id}>
                <TableCell className="font-medium">{(currentPage - 1) * ITEMS_PER_PAGE + idx + 1}</TableCell>
                <TableCell className="font-semibold text-primary uppercase">{error.code}</TableCell>
                <TableCell>{error.message}</TableCell>
                <TableCell>{error.category}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => console.log(`View ${error.code}`)}>
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => console.log(`Edit ${error.code}`)}>
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-red-600 focus:text-red-600 focus:bg-red-50" onClick={() => console.log(`Delete ${error.code}`)}>
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="mt-6 flex justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage > 1) handlePageChange(currentPage - 1);
                  }}
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : undefined}
                />
              </PaginationItem>
              {[...Array(totalPages)].map((_, i) => {
                const pageNum = i + 1;
                if (
                  totalPages <= 5 ||
                  pageNum === 1 ||
                  pageNum === totalPages ||
                  (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                ) {
                  return (
                    <PaginationItem key={pageNum}>
                      <PaginationLink
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          handlePageChange(pageNum);
                        }}
                        isActive={currentPage === pageNum}
                      >
                        {pageNum}
                      </PaginationLink>
                    </PaginationItem>
                  );
                } else if (
                  (pageNum === currentPage - 2 && pageNum !== 1) ||
                  (pageNum === currentPage + 2 && pageNum !== totalPages)
                ) {
                  return <PaginationEllipsis key={`ellipsis-${pageNum}`} />;
                }
                return null;
              })}
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage < totalPages) handlePageChange(currentPage + 1);
                  }}
                  className={currentPage === totalPages ? "pointer-events-none opacity-50" : undefined}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}; 