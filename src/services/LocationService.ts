import { supabase } from "@/lib/supabase";
import { safeQueryWithFallback } from "@/utils/supabaseErrorHandler";

/**
 * @fileoverview Service for fetching location-related data.
 */

/**
 * Represents the structure for unique location identifiers.
 */
interface LocationData {
  state?: string;
  location?: string; // Typically city
  zip_code?: string;
}

/**
 * Provides methods for fetching unique location data from profiles.
 */
export const LocationService = {
  /**
   * Fetches unique states, locations (cities), and zip codes from the profiles table.
   * Handles potential errors using safeQueryWithFallback.
   * Includes logic to check admin status and potentially filter locations based on user ID if needed (currently fetches all).
   * @returns {Promise<{ states: string[], locations: string[], zipCodes: string[] }>} A promise resolving to an object containing arrays of unique states, locations, and zip codes.
   */
  async getUniqueLocations(): Promise<{ states: string[], locations: string[], zipCodes: string[] }> {
    try {
      console.log("Fetching unique locations...");

      // Check if the current user is an admin (optional, depending on requirements)
      // const { data: isAdmin, error: adminCheckError } = await supabase.rpc('check_is_admin');
      // if (adminCheckError) {
      //   console.error("Error checking admin status:", adminCheckError);
      //   // Decide how to handle this - maybe fetch all locations anyway?
      // }

      // Fetch distinct location data using safeQueryWithFallback
      // Removed explicit type argument <LocationData[]> as it might not be supported
      const data = await safeQueryWithFallback(
        () => supabase
          .from('profiles')
          .select('state, location, zip_code'), // Select only necessary columns
        [], // Fallback to empty array
        2   // Retries
      );

      const states = new Set<string>();
      const locations = new Set<string>(); // Typically cities
      const zipCodes = new Set<string>();

      (data || []).forEach(profile => {
        if (profile.state) states.add(profile.state);
        if (profile.location) locations.add(profile.location); // Assuming 'location' is city
        if (profile.zip_code) zipCodes.add(profile.zip_code);
      });

      const uniqueStates = Array.from(states).sort();
      const uniqueLocations = Array.from(locations).sort();
      const uniqueZipCodes = Array.from(zipCodes).sort();

      console.log("Unique locations fetched:", {
        states: uniqueStates.length,
        locations: uniqueLocations.length,
        zipCodes: uniqueZipCodes.length
      });

      return {
        states: uniqueStates,
        locations: uniqueLocations,
        zipCodes: uniqueZipCodes
      };
    } catch (error) {
      console.error("Error fetching unique locations:", error);
      // Return empty arrays in case of error
      return { states: [], locations: [], zipCodes: [] };
    }
  },
};