'use client';

import React, { useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { FixedAdminService, ClinicalResource } from '@/services/FixedAdminService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from 'sonner';

// Define the validation schema using Zod
const resourceSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters long." }),
  description: z.string().optional(),
  link: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal('')),
  category: z.enum(['diagnostics', 'equipment', 'community'], { required_error: "Category is required." }),
  icon_name: z.string().optional(),
  is_active: z.boolean().default(true),
});

// Infer the TypeScript type from the schema
type ResourceFormData = z.infer<typeof resourceSchema>;

interface ClinicalResourceFormProps {
  resource: ClinicalResource | null; // Null for creating, existing resource for editing
  onClose: (refresh: boolean) => void; // Callback to close the form/modal
}

const ClinicalResourceForm: React.FC<ClinicalResourceFormProps> = ({ resource, onClose }) => {
  const { register, handleSubmit, reset, control, formState: { errors, isSubmitting } } = useForm<ResourceFormData>({
    resolver: zodResolver(resourceSchema),
    defaultValues: {
      title: resource?.title || '',
      description: resource?.description || '',
      link: resource?.link || '',
      category: resource?.category || undefined, // Set undefined initially for placeholder
      icon_name: resource?.icon_name || '',
      is_active: resource?.is_active ?? true, // Default to true if creating
    },
  });

  // Reset form if the resource prop changes (e.g., opening the form for a different resource)
  useEffect(() => {
    reset({
      title: resource?.title || '',
      description: resource?.description || '',
      link: resource?.link || '',
      category: resource?.category || undefined,
      icon_name: resource?.icon_name || '',
      is_active: resource?.is_active ?? true,
    });
  }, [resource, reset]);

  const onSubmit: SubmitHandler<ResourceFormData> = async (data) => {
    try {
      let success = false;
      if (resource) {
        // Update existing resource
        success = await FixedAdminService.updateClinicalResource(resource.id, data);
      } else {
        // Create new resource
        // Explicitly create payload to satisfy the Omit type expected by the service
        const payload: Omit<ClinicalResource, 'id' | 'created_at' | 'updated_at'> = {
            title: data.title, // Zod ensures this is a non-empty string
            category: data.category, // Zod ensures this is one of the enum values
            is_active: data.is_active, // Zod ensures this is a boolean (default true)
            description: data.description, // Optional
            link: data.link, // Optional
            icon_name: data.icon_name, // Optional
        };
        const newResource = await FixedAdminService.createClinicalResource(payload);
        success = !!newResource;
      }

      if (success) {
        onClose(true); // Close and refresh the list
      }
      // Error toasts are handled within the service
    } catch (error) {
      // Service should handle toast notifications for errors
      console.error("Form submission error:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="title">Title</Label>
        <Input id="title" {...register('title')} />
        {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>}
      </div>

      <div>
        <Label htmlFor="category">Category</Label>
        {/* Need to use Controller for ShadCN Select with react-hook-form */}
        <Controller
          name="category"
          control={control}
          render={({ field }) => (
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="diagnostics">Diagnostics</SelectItem>
                <SelectItem value="equipment">Equipment</SelectItem>
                <SelectItem value="community">Community</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
         {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category.message}</p>}
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" {...register('description')} />
        {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>}
      </div>

      <div>
        <Label htmlFor="link">Link (URL)</Label>
        <Input id="link" type="url" {...register('link')} placeholder="https://example.com" />
        {errors.link && <p className="text-red-500 text-sm mt-1">{errors.link.message}</p>}
      </div>

      <div>
        <Label htmlFor="icon_name">Icon Name (Optional, e.g., Lucide icon)</Label>
        <Input id="icon_name" {...register('icon_name')} placeholder="Microscope" />
        {errors.icon_name && <p className="text-red-500 text-sm mt-1">{errors.icon_name.message}</p>}
      </div>

      <div className="flex items-center space-x-2">
         {/* Need to use Controller for ShadCN Switch with react-hook-form */}
         <Controller
            name="is_active"
            control={control}
            render={({ field }) => (
                <Switch
                    id="is_active"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                />
            )}
          />
        <Label htmlFor="is_active">Active</Label>
        {errors.is_active && <p className="text-red-500 text-sm mt-1">{errors.is_active.message}</p>}
      </div>


      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={() => onClose(false)} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (resource ? 'Updating...' : 'Creating...') : (resource ? 'Update Resource' : 'Create Resource')}
        </Button>
      </div>
    </form>
  );
};

// Need to import Controller from react-hook-form
import { Controller } from 'react-hook-form';

export default ClinicalResourceForm;