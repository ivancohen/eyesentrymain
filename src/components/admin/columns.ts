import React from "react";
import type { ColumnDef } from "@tanstack/react-table";
// We'll define the actual rendering in the component using this definition

// Placeholder type for question data - replace with your actual type from QuestionService.enhanced.ts
export type Question = {
  id: string;
  question: string;
  page_category: string;
  status: string;
  display_order: number;
  // Add other relevant fields from the Question interface if needed for display
  actions?: React.ReactNode; // Add actions property for edit button
};

// Type for the props passed to the columns function
interface ColumnsProps {
  onEdit: (item: Question) => void;
  // Add other handlers if needed, e.g., onDelete
}

// Basic columns definition - Actual rendering (like buttons) will happen in the DataTable component
export const columns = ({ onEdit }: ColumnsProps): ColumnDef<Question>[] => [
  {
    accessorKey: "display_order",
    header: "Order",
    // Basic cell rendering, sorting can be enabled in DataTable
    cell: ({ row }) => row.original.display_order,
  },
  {
    accessorKey: "question",
    header: "Question",
    cell: ({ row }) => row.original.question,
  },
  {
    accessorKey: "page_category",
    header: "Category",
    cell: ({ row }) => row.original.page_category,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => row.original.status,
  },
  {
    id: "actions",
    header: "Actions",
    // Use the actions property we added in the component
    cell: ({ row }) => row.original.actions,
  },
];