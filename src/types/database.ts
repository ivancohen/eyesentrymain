export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      specialist_consultation_links: {
        Row: {
          id: string
          patient_id: string
          consultation_token: string
          created_at: string
          expires_at: string
          is_used: boolean
          created_by_doctor_id: string
        }
        Insert: {
          id?: string
          patient_id: string
          consultation_token: string
          created_at?: string
          expires_at: string
          is_used?: boolean
          created_by_doctor_id: string
        }
        Update: {
          id?: string
          patient_id?: string
          consultation_token?: string
          created_at?: string
          expires_at?: string
          is_used?: boolean
          created_by_doctor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "specialist_consultation_links_patient_id_fkey"
            columns: ["patient_id"]
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "specialist_consultation_links_created_by_doctor_id_fkey"
            columns: ["created_by_doctor_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      specialist_consultations: {
        Row: {
          id: string
          consultation_link_id: string
          specialist_name: string
          specialist_credentials: string
          specialty: string
          consultation_notes: string | null
          recommendations: string | null
          created_at: string
        }
        Insert: {
          id?: string
          consultation_link_id: string
          specialist_name: string
          specialist_credentials: string
          specialty: string
          consultation_notes?: string | null
          recommendations?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          consultation_link_id?: string
          specialist_name?: string
          specialist_credentials?: string
          specialty?: string
          consultation_notes?: string | null
          recommendations?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "specialist_consultations_consultation_link_id_fkey"
            columns: ["consultation_link_id"]
            referencedRelation: "specialist_consultation_links"
            referencedColumns: ["id"]
          }
        ]
      }
      patients: {
        Row: {
          id: string
          doctor_id: string
          // Add other patient fields as needed
        }
        Insert: {
          id?: string
          doctor_id: string
          // Add other patient fields as needed
        }
        Update: {
          id?: string
          doctor_id?: string
          // Add other patient fields as needed
        }
        Relationships: [
          {
            foreignKeyName: "patients_doctor_id_fkey"
            columns: ["doctor_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      users: {
        Row: {
          id: string
          // Add other user fields as needed
        }
        Insert: {
          id?: string
          // Add other user fields as needed
        }
        Update: {
          id?: string
          // Add other user fields as needed
        }
      }
    }
    Functions: {
      generate_consultation_link: {
        Args: {
          p_patient_id: string
          p_expires_in_days?: number
        }
        Returns: string
      }
    }
    Enums: Record<string, never>
  }
} 