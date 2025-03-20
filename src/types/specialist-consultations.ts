export interface SpecialistConsultationLink {
  id: string;
  patient_id: string;
  consultation_token: string;
  created_at: string;
  expires_at: string;
  is_used: boolean;
}

export interface SpecialistConsultation {
  id: string;
  consultation_link_id: string;
  specialist_name: string;
  specialist_credentials: string;
  specialty: string;
  consultation_notes: string;
  recommendations: string;
  created_at: string;
}

export type SpecialistConsultationInsert = Omit<SpecialistConsultation, 'id' | 'created_at'>; 