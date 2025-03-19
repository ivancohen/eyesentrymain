
import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, PlusCircle, Edit, Trash } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface DataItem {
  id: string;
  [key: string]: any;
}

interface DataTableProps {
  data: DataItem[];
  columns: { key: string; label: string }[];
  onAdd?: () => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

const DataTable = ({ data, columns, onAdd, onEdit, onDelete }: DataTableProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const { isAdmin } = useAuth();

  const filteredData = data.filter((item) =>
    Object.values(item).some(
      (value) =>
        value &&
        value.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  return (
    <Card className="w-full glass-panel animate-fade-in p-4">
      <div className="flex justify-between items-center mb-4">
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <Input
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 input-animation"
          />
        </div>
        {isAdmin && onAdd && (
          <Button onClick={onAdd} className="hover-lift flex items-center gap-2">
            <PlusCircle size={16} />
            <span>Add New</span>
          </Button>
        )}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column.key}>{column.label}</TableHead>
              ))}
              {isAdmin && (onEdit || onDelete) && <TableHead>Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length > 0 ? (
              filteredData.map((item) => (
                <TableRow key={item.id} className="hover:bg-secondary/40 transition-colors">
                  {columns.map((column) => (
                    <TableCell key={`${item.id}-${column.key}`}>
                      {item[column.key]}
                    </TableCell>
                  ))}
                  {isAdmin && (onEdit || onDelete) && (
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {onEdit && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEdit(item.id)}
                            className="hover:bg-primary/10 hover:text-primary h-8 w-8 p-0"
                          >
                            <Edit size={16} />
                          </Button>
                        )}
                        {onDelete && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDelete(item.id)}
                            className="hover:bg-destructive/10 hover:text-destructive h-8 w-8 p-0"
                          >
                            <Trash size={16} />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={
                    columns.length + (isAdmin && (onEdit || onDelete) ? 1 : 0)
                  }
                  className="text-center h-24 text-muted-foreground"
                >
                  No results found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
};

export default DataTable;
