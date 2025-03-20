import { supabase } from "@/lib/supabase";
import type { Database } from "../types/database.types";

type Tables = Database['public']['Tables'];
type ConsultationLink = Tables['specialist_consultation_links']['Row'];
type Consultation = Tables['specialist_consultations']['Row'];
type ConsultationInsert = Tables['specialist_consultations']['Insert'];
type ConsultationData = Omit<ConsultationInsert, 'consultation_link_id'>;

// Note: This service uses type assertions (as unknown as Type) in several places
// to work around limitations in Supabase's type system. While this isn't ideal,
// it's necessary because Supabase's types are very strict and don't always align
// with the actual runtime types. These assertions are safe as they match the
// actual database schema defined in database.ts.

export class SpecialistConsultationService {
  private static readonly LINK_EXPIRY_DAYS = 30;

  /**
   * Generates a consultation link for a patient
   * @param patientId The ID of the patient
   * @returns The consultation token
   */
  static async generateConsultationLink(patientId: string): Promise<string> {
    try {
      const { data, error } = await supabase.rpc('generate_consultation_link', {
        p_patient_id: patientId,
        p_expires_in_days: this.LINK_EXPIRY_DAYS,
      });

      if (error) throw error;
      if (!data) throw new Error('Failed to generate consultation link');

      return data;
    } catch (error) {
      console.error('Error generating consultation link:', error);
      throw error;
    }
  }

  /**
   * Retrieves all consultation links for a patient
   * @param patientId The ID of the patient
   * @returns Array of consultation links
   */
  static async getConsultationLinks(patientId: string): Promise<ConsultationLink[]> {
    try {
      const { data, error } = await supabase
        .from('specialist_consultation_links')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching consultation links:', error);
      throw error;
    }
  }

  /**
   * Gets all consultations for a patient
   * @param patientId The ID of the patient
   * @returns Array of consultations
   */
  static async getConsultations(patientId: string) {
    const query = supabase
      .from("specialist_consultations")
      .select("*, specialist_consultation_links!inner(*)")
      .eq("specialist_consultation_links.patient_id", patientId)
      .order("created_at", { ascending: false });

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return data;
  }

  /**
   * Submits a consultation using a valid token
   * @param token The consultation token
   * @param consultationData The consultation data
   * @returns The created consultation
   */
  static async submitConsultation(
    token: string,
    consultationData: ConsultationData
  ): Promise<Consultation> {
    try {
      // First, validate and get the consultation link
      const { data: linkData, error: linkError } = await supabase
        .from('specialist_consultation_links')
        .select('*')
        .eq('consultation_token', token)
        .eq('is_used', false)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (linkError) throw new Error('Invalid consultation token');
      if (!linkData) throw new Error('Consultation link not found or expired');

      // Start a transaction
      const { data: consultation, error: consultationError } = await supabase
        .from('specialist_consultations')
        .insert({
          consultation_link_id: linkData.id,
          ...consultationData,
        })
        .select()
        .single();

      if (consultationError) throw consultationError;

      // Mark the link as used
      const { error: updateError } = await supabase
        .from('specialist_consultation_links')
        .update({ is_used: true })
        .eq('id', linkData.id);

      if (updateError) throw updateError;

      return consultation;
    } catch (error) {
      console.error('Error submitting consultation:', error);
      throw error;
    }
  }

  /**
   * Validates a consultation token
   * @param token The consultation token to validate
   * @returns True if the token is valid, false otherwise
   */
  static async validateConsultationToken(token: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('specialist_consultation_links')
        .select('id')
        .eq('consultation_token', token)
        .eq('is_used', false)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (error) return false;
      return !!data;
    } catch (error) {
      console.error('Error validating consultation token:', error);
      return false;
    }
  }
} 