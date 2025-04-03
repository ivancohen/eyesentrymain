import { supabase } from "@/lib/supabase";
import { safeQueryWithFallback } from "@/utils/supabaseErrorHandler";

/**
 * @fileoverview Service for fetching patient-related data.
 */

/**
 * Represents the structure of patient data, often joined with doctor/profile info.
 */
export interface PatientData {
  id: string; // Usually the patient record ID or questionnaire ID
  created_at: string;
  doctor_id: string; // ID of the doctor associated with the patient/record
  profile_id: string; // ID from the profiles table (could be patient or doctor)
  doctor_email: string; // Email of the associated doctor
  doctor_name?: string; // Name of the associated doctor
  office_location?: string; // Location associated with the doctor/patient
  state?: string;
  zip_code?: string;
  specialty?: string; // Doctor's specialty
  // Add other relevant patient fields as needed from the source query
}

/**
 * Represents filters that can be applied when fetching patient data.
 */
export interface LocationFilter {
  doctor_id?: string;
  state?: string;
  zip_code?: string;
  office_location?: string; // Assuming this corresponds to 'location' or 'city'
}

/**
 * Provides methods for fetching patient data.
 */
export const PatientDataService = {
  /**
   * Fetches patient data based on provided filters.
   * The exact implementation depends on the underlying database view or function ('fetch_patient_data_view' or similar).
   * @param {LocationFilter} filters - The filters to apply (doctor_id, state, etc.).
   * @returns {Promise<PatientData[]>} A promise resolving to an array of filtered patient data.
   */
  async fetchPatientData(filters: LocationFilter): Promise<PatientData[]> {
    console.log("Fetching patient data with filters:", filters);

    // This implementation assumes a view or function exists.
    // Adjust the query based on the actual database structure.
    // Example using a hypothetical view 'patient_data_view':
    let query = supabase.from('patient_data_view').select('*'); // Replace 'patient_data_view' with the actual source

    if (filters.doctor_id && filters.doctor_id !== 'all_doctors') {
      query = query.eq('doctor_id', filters.doctor_id);
    }
    if (filters.state && filters.state !== 'all_states') {
      query = query.eq('state', filters.state);
    }
    if (filters.zip_code && filters.zip_code !== 'all_zip_codes') {
      query = query.eq('zip_code', filters.zip_code);
    }
    // Assuming office_location filter corresponds to 'location' or 'city' column
    if (filters.office_location && filters.office_location !== 'all_cities') {
       // Adjust column name if needed (e.g., 'city')
      query = query.eq('office_location', filters.office_location);
    }

    query = query.order('created_at', { ascending: false });

    // Removed explicit type argument <PatientData[]> as it might not be supported
    const data = await safeQueryWithFallback(
      () => query,
      [], // Fallback to empty array
      2   // Retries
    );

    // Basic mapping, adjust based on actual view columns
    const patientData: PatientData[] = (data || []).map((item: any) => ({
      id: item.id,
      created_at: item.created_at,
      doctor_id: item.doctor_id,
      profile_id: item.profile_id, // Ensure this column exists in the view
      doctor_email: item.doctor_email,
      doctor_name: item.doctor_name,
      office_location: item.office_location,
      state: item.state,
      zip_code: item.zip_code,
      specialty: item.specialty,
    }));


    console.log("Patient data fetched successfully:", patientData.length, "results");
    return patientData;
  },

  /**
   * Fetches anonymous patient data.
   * The implementation depends on the specific requirements and data source.
   * Placeholder implementation.
   * @returns {Promise<any[]>} A promise resolving to an array of anonymous patient data.
   */
  async fetchAnonymousPatientData(): Promise<any[]> {
    console.warn("fetchAnonymousPatientData is not fully implemented.");
    // Placeholder: Replace with actual logic to fetch anonymized data
    // Example: Fetching aggregated data or data with identifiers removed
    // const data = await safeQueryWithFallback(
    //   () => supabase.from('some_anonymized_view').select('*'),
    //   [],
    //   2
    // );
    // return data || [];
    return [];
  },
};