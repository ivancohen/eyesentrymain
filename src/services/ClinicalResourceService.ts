import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { safeQueryWithFallback } from "@/utils/supabaseErrorHandler";

/**
 * @fileoverview Service for managing clinical resources data.
 */

/**
 * Represents the structure of a clinical resource in the database.
 */
export interface ClinicalResource {
  id: string;
  title: string;
  description?: string;
  link?: string;
  category: 'diagnostics' | 'equipment' | 'community'; // Example categories
  icon_name?: string; // Name of the Lucide icon to use
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Provides methods for interacting with clinical resources data.
 */
export const ClinicalResourceService = {
  /**
   * Fetches all clinical resources from the database.
   * Orders results by creation date descending.
   * @returns {Promise<ClinicalResource[]>} A promise resolving to an array of clinical resources.
   */
  async fetchClinicalResources(): Promise<ClinicalResource[]> {
    console.log("Fetching clinical resources...");

    const data = await safeQueryWithFallback(
      () => supabase
        .from('clinical_resources')
        .select('*')
        .order('created_at', { ascending: false }),
      [], // Fallback to empty array
      2   // Retries
    );

    // Ensure data conforms to the interface, handling potential nulls/undefined
    const resources: ClinicalResource[] = (data || []).map((res: any) => ({
      id: res.id,
      title: res.title || 'Untitled Resource',
      description: res.description || undefined,
      link: res.link || undefined,
      category: res.category || 'community', // Default category
      icon_name: res.icon_name || undefined,
      is_active: res.is_active === true, // Ensure boolean
      created_at: res.created_at,
      updated_at: res.updated_at,
    }));

    console.log("Clinical resources fetched successfully:", resources.length, "results");
    return resources;
  },

  /**
   * Creates a new clinical resource in the database.
   * @param {Omit<ClinicalResource, 'id' | 'created_at' | 'updated_at'>} resourceData - The data for the new resource.
   * @returns {Promise<ClinicalResource | null>} A promise resolving to the created resource or null if creation failed.
   */
  async createClinicalResource(resourceData: Omit<ClinicalResource, 'id' | 'created_at' | 'updated_at'>): Promise<ClinicalResource | null> {
    try {
      console.log("Creating new clinical resource:", resourceData.title);
      const { data, error } = await supabase
        .from('clinical_resources')
        .insert([resourceData])
        .select()
        .single(); // Assuming insert returns the created row

      if (error) {
        console.error("Error creating clinical resource:", error);
        throw error;
      }

      if (!data) {
        throw new Error("No data returned after creating clinical resource.");
      }

      toast.success(`Clinical resource "${data.title}" created successfully`);
      return data as ClinicalResource;
    } catch (error: unknown) {
      console.error("Error creating clinical resource:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error(`Error creating clinical resource: ${errorMessage}`);
      return null;
    }
  },

  /**
   * Updates an existing clinical resource in the database.
   * @param {string} resourceId - The ID of the resource to update.
   * @param {Partial<Omit<ClinicalResource, 'id' | 'created_at' | 'updated_at'>>} resourceData - The data to update.
   * @returns {Promise<boolean>} A promise resolving to true if successful, false otherwise.
   */
  async updateClinicalResource(resourceId: string, resourceData: Partial<Omit<ClinicalResource, 'id' | 'created_at' | 'updated_at'>>): Promise<boolean> {
    try {
      console.log(`Updating clinical resource: ${resourceId}`);
      const { error } = await supabase
        .from('clinical_resources')
        .update(resourceData)
        .eq('id', resourceId);

      if (error) {
        console.error("Error updating clinical resource:", error);
        throw error;
      }

      toast.success("Clinical resource updated successfully");
      return true;
    } catch (error: unknown) {
      console.error("Error updating clinical resource:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error(`Error updating clinical resource: ${errorMessage}`);
      return false;
    }
  },

  /**
   * Deletes a clinical resource from the database.
   * @param {string} resourceId - The ID of the resource to delete.
   * @returns {Promise<boolean>} A promise resolving to true if successful, false otherwise.
   */
  async deleteClinicalResource(resourceId: string): Promise<boolean> {
    try {
      console.log(`Deleting clinical resource: ${resourceId}`);
      const { error } = await supabase
        .from('clinical_resources')
        .delete()
        .eq('id', resourceId);

      if (error) {
        console.error("Error deleting clinical resource:", error);
        throw error;
      }

      toast.success("Clinical resource deleted successfully");
      return true;
    } catch (error: unknown) {
      console.error("Error deleting clinical resource:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error(`Error deleting clinical resource: ${errorMessage}`);
      return false;
    }
  },
};