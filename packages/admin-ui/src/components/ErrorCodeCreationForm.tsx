"use client";

import React from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { Button } from "@/components/ui/Button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
// Assuming you might have a toast component for notifications
// import { toast } from "@/components/ui/use-toast";

// Mock categories data - replace with actual data fetching
const mockCategories = [
  { id: "1", name: "User Management" },
  { id: "2", name: "Billing" },
  { id: "3", name: "API Security" },
  { id: "4", name: "General" },
  { id: "5", name: "System" },
];

const errorCodeSchema = z.object({
  code: z.string().min(3, {
    message: "Error code must be at least 3 characters.",
  }).regex(/^[A-Z0-9_]+\.[A-Z0-9_]+(\.[A-Z0-9_]+)*$/, { // Basic check for DOMAIN.ENTITY.ACTION or similar
    message: "Error code must follow a pattern like DOMAIN.ENTITY.ACTION (e.g., USER.NOT_FOUND). Use uppercase letters, numbers, and underscores.",
  }),
  categoryId: z.string().optional(), // Optional category
  defaultMessage: z.string().min(10, {
    message: "Default message must be at least 10 characters.",
  }),
});

type ErrorCodeFormValues = z.infer<typeof errorCodeSchema>;

// Default values for the form
const defaultValues: Partial<ErrorCodeFormValues> = {
  code: "",
  categoryId: "",
  defaultMessage: "",
};

const ErrorCodeCreationForm: React.FC = () => {
  const form = useForm<ErrorCodeFormValues>({
    resolver: zodResolver(errorCodeSchema),
    defaultValues,
    mode: "onChange",
  });

  function onSubmit(data: ErrorCodeFormValues) {
    const submissionData = {
      ...data,
      categoryId: data.categoryId === "__NONE__" ? undefined : data.categoryId,
    };
    console.log("Form submitted:", submissionData);
    // Here you would typically call your API to save the data
    // For example:
    // toast({
    //   title: "You submitted the following values:",
    //   description: (
    //     <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
    //       <code className="text-white">{JSON.stringify(data, null, 2)}</code>
    //     </pre>
    //   ),
    // });
    // form.reset(); // Optionally reset form after submission
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 max-w-2xl">
        <FormField
          control={form.control}
          name="code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Error Code *</FormLabel>
              <FormControl>
                <Input placeholder="e.g., USER.NOT_FOUND" {...field} />
              </FormControl>
              <FormDescription>
                Use dot notation (e.g., DOMAIN.ENTITY.ACTION_RESULT). Uppercase, numbers, underscores.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="categoryId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category (Optional)</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="__NONE__">None</SelectItem>
                  {mockCategories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Assigning a category helps in organizing error codes.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="defaultMessage"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Default Message *</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter the default user-facing message for this error code..."
                  className="resize-none"
                  rows={4}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                This is the message that will be shown by default if no specific translation is available.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Create Error Code</Button>
      </form>
    </Form>
  );
};

export default ErrorCodeCreationForm; 