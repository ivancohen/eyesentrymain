import { supabase } from "@/lib/supabase";

export interface ClinicalResource {
  id: string;
  title: string;
  description?: string;
  link?: string;
  category: 'diagnostics' | 'equipment' | 'community';
  icon_name?: string; // Optional: Store Lucide icon name
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Type for creating/updating (omitting auto-generated fields)
export type ClinicalResourceData = Omit<ClinicalResource, 'id' | 'created_at' | 'updated_at'>;

export class ClinicalResourceService {
  private tableName = 'clinical_resources';

  // Fetch all active resources
  async getResources(): Promise<ClinicalResource[]> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('is_active', true)
        .order('category')
        .order('title'); // Add secondary sort if needed

      if (error) {
        console.error("Error fetching clinical resources:", error);
        throw error;
      }
      return data || [];
    } catch (error) {
      console.error("Error in getResources:", error);
      return []; // Return empty array on error
    }
  }

  // Fetch all resources (for admin)
  async getAllResourcesAdmin(): Promise<ClinicalResource[]> {
     try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .order('category')
        .order('title');

      if (error) {
        console.error("Error fetching all clinical resources for admin:", error);
        throw error;
      }
      return data || [];
    } catch (error) {
      console.error("Error in getAllResourcesAdmin:", error);
      return [];
    }
  }

  // Create a new resource
  async createResource(resourceData: ClinicalResourceData): Promise<ClinicalResource | null> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .insert({ ...resourceData, is_active: true }) // Ensure new resources are active
        .select()
        .single();

      if (error) {
        console.error("Error creating clinical resource:", error);
        throw error;
      }
      return data;
    } catch (error) {
       console.error("Error in createResource:", error);
       return null;
    }
  }

  // Update an existing resource
  async updateResource(id: string, resourceData: Partial<ClinicalResourceData>): Promise<boolean> {
     try {
      const { error } = await supabase
        .from(this.tableName)
        .update({ ...resourceData, updated_at: new Date().toISOString() }) // Manually update timestamp if no trigger
        .eq('id', id);

      if (error) {
        console.error("Error updating clinical resource:", error);
        throw error;
      }
      return true;
    } catch (error) {
       console.error("Error in updateResource:", error);
       return false;
    }
  }

  // Delete a resource (soft delete by marking inactive)
  async deleteResource(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from(this.tableName)
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) {
        console.error("Error deleting clinical resource:", error);
        throw error;
      }
      return true;
    } catch (error) {
       console.error("Error in deleteResource:", error);
       return false;
    }
  }

   // Hard delete (optional, use with caution)
  async hardDeleteResource(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from(this.tableName)
        .delete()
        .eq('id', id);

      if (error) {
        console.error("Error permanently deleting clinical resource:", error);
        throw error;
      }
      return true;
    } catch (error) {
       console.error("Error in hardDeleteResource:", error);
       return false;
    }
  }
}

// Export a singleton instance
export const clinicalResourceService = new ClinicalResourceService();