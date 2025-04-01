import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface DataTableProps {
  columns: any[];
  data: any[];
  searchColumn?: string;
  searchPlaceholder?: string;
  tableClassName?: string;
}

export function DataTable({
  columns,
  data,
  searchColumn,
  searchPlaceholder = "Search...",
  tableClassName
}: DataTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  
  // Filter data based on search term
  const filteredData = searchColumn && searchTerm
    ? data.filter(item => {
        const value = item[searchColumn]?.toString().toLowerCase() || "";
        return value.includes(searchTerm.toLowerCase());
      })
    : data;

  return (
    <div className="space-y-4">
      {searchColumn && (
        <Input
          placeholder={searchPlaceholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      )}
      <div className="rounded-md border">
        <Table className={cn("min-w-full", tableClassName)}>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column.accessorKey || column.id} className="px-4 py-3">
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results found.
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((row) => (
                <TableRow key={row.id} className="border-b">
                  {columns.map((column) => (
                    <TableCell key={column.accessorKey || column.id} className="px-4 py-3">
                      {column.cell ? column.cell({ row: { original: row } }) : row[column.accessorKey]}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
