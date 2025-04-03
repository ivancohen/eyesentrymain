'use client';

import React from 'react';
import { ClinicalResource } from '@/services'; // Import from barrel file
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, ExternalLink, CheckCircle, XCircle } from 'lucide-react';

interface ClinicalResourcesTableProps {
  resources: ClinicalResource[];
  onEdit: (resource: ClinicalResource) => void;
  onDelete: (resourceId: string) => void;
}

const ClinicalResourcesTable: React.FC<ClinicalResourcesTableProps> = ({ resources, onEdit, onDelete }) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Title</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Description</TableHead>
          <TableHead>Link</TableHead>
          <TableHead>Icon</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {resources.length === 0 ? (
          <TableRow>
            <TableCell colSpan={7} className="text-center">No resources found.</TableCell>
          </TableRow>
        ) : (
          resources.map((resource) => (
            <TableRow key={resource.id}>
              <TableCell className="font-medium">{resource.title}</TableCell>
              <TableCell>
                <Badge variant="secondary">{resource.category}</Badge>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground truncate max-w-xs">
                {resource.description || '-'}
              </TableCell>
              <TableCell>
                {resource.link ? (
                  <a href={resource.link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline inline-flex items-center">
                    Visit Link <ExternalLink className="ml-1 h-3 w-3" />
                  </a>
                ) : (
                  '-'
                )}
              </TableCell>
              <TableCell>{resource.icon_name || '-'}</TableCell>
              <TableCell>
                {resource.is_active ? (
                  <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                    <CheckCircle className="mr-1 h-3 w-3" /> Active
                  </Badge>
                ) : (
                  <Badge variant="destructive">
                    <XCircle className="mr-1 h-3 w-3" /> Inactive
                  </Badge>
                )}
              </TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="icon" onClick={() => onEdit(resource)} className="mr-2">
                  <Edit className="h-4 w-4" />
                  <span className="sr-only">Edit</span>
                </Button>
                <Button variant="ghost" size="icon" onClick={() => onDelete(resource.id)} className="text-red-600 hover:text-red-700">
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Delete</span>
                </Button>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
};

export default ClinicalResourcesTable;