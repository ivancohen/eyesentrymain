export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string;
          created_at: string;
          is_admin: boolean;
        };
        Insert: {
          id?: string;
          email: string;
          name: string;
          created_at?: string;
          is_admin?: boolean;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          created_at?: string;
          is_admin?: boolean;
        };
      };
      data_items: {
        Row: {
          id: string;
          name: string;
          category: string;
          value: string;
          date: string;
          created_at: string;
          created_by: string;
        };
        Insert: {
          id?: string;
          name: string;
          category: string;
          value: string;
          date: string;
          created_at?: string;
          created_by: string;
        };
        Update: {
          id?: string;
          name?: string;
          category?: string;
          value?: string;
          date?: string;
          created_at?: string;
          created_by?: string;
        };
      };
      categories: {
        Row: {
          id: string;
          name: string;
          description: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string;
          created_at?: string;
        };
      };
      user_settings: {
        Row: {
          id: string;
          user_id: string;
          theme: string;
          notifications_enabled: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          theme?: string;
          notifications_enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          theme?: string;
          notifications_enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          email: string;
          name: string | null;
          is_admin: boolean;
          created_at: string;
          avatar_url?: string | null;
        };
        Insert: {
          id: string;
          email: string;
          name?: string | null;
          is_admin?: boolean;
          created_at?: string;
          avatar_url?: string | null;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string | null;
          is_admin?: boolean;
          created_at?: string;
          avatar_url?: string | null;
        };
      };
      questions: {
        Row: {
          id: string;
          question: string;
          created_at: string;
          created_by: string;
          question_type?: string;
          has_conditional_items?: boolean;
          has_dropdown_options?: boolean;
          has_dropdown_scoring?: boolean;
          page_category?: string;
        };
        Insert: {
          id?: string;
          question: string;
          created_at?: string;
          created_by: string;
          question_type?: string;
          has_conditional_items?: boolean;
          has_dropdown_options?: boolean;
          has_dropdown_scoring?: boolean;
          page_category?: string;
        };
        Update: {
          id?: string;
          question?: string;
          created_at?: string;
          created_by?: string;
          question_type?: string;
          has_conditional_items?: boolean;
          has_dropdown_options?: boolean;
          has_dropdown_scoring?: boolean;
          page_category?: string;
        };
      };
      conditional_items: {
        Row: {
          id: string;
          question_id: string;
          condition_value: string;
          response_message: string;
          condition_type: string;
          created_at: string;
          score?: number;
        };
        Insert: {
          id?: string;
          question_id: string;
          condition_value: string;
          response_message: string;
          condition_type: string;
          created_at?: string;
          score?: number;
        };
        Update: {
          id?: string;
          question_id?: string;
          condition_value?: string;
          response_message?: string;
          condition_type?: string;
          created_at?: string;
          score?: number;
        };
      };
      dropdown_options: {
        Row: {
          id: string;
          question_id: string;
          option_text: string;
          option_value: string;
          score: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          question_id: string;
          option_text: string;
          option_value: string;
          score?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          question_id?: string;
          option_text?: string;
          option_value?: string;
          score?: number;
          created_at?: string;
        };
      };
      patient_questionnaires: {
        Row: {
          id: string;
          user_id: string;
          first_name: string;
          last_name: string;
          age: string; // Updated from number to string
          race: string;
          family_glaucoma: boolean;
          ocular_steroid: boolean;
          intravitreal: boolean;
          systemic_steroid: boolean;
          iop_baseline: boolean;
          vertical_asymmetry: boolean;
          vertical_ratio: boolean;
          total_score: number;
          risk_level: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          first_name: string;
          last_name: string;
          age: string; // Updated from number to string
          race: string;
          family_glaucoma: boolean;
          ocular_steroid: boolean;
          intravitreal: boolean;
          systemic_steroid: boolean;
          iop_baseline: boolean;
          vertical_asymmetry: boolean;
          vertical_ratio: boolean;
          total_score?: number;
          risk_level?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          first_name?: string;
          last_name?: string;
          age?: string; // Updated from number to string
          race?: string;
          family_glaucoma?: boolean;
          ocular_steroid?: boolean;
          intravitreal?: boolean;
          systemic_steroid?: boolean;
          iop_baseline?: boolean;
          vertical_asymmetry?: boolean;
          vertical_ratio?: boolean;
          total_score?: number;
          risk_level?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      // AI Assistant tables
      ai_conversations: {
        Row: {
          conversation_id: string;
          user_id: string;
          title: string;
          messages: any;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          conversation_id?: string;
          user_id: string;
          title: string;
          messages?: any;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          conversation_id?: string;
          user_id?: string;
          title?: string;
          messages?: any;
          created_at?: string;
          updated_at?: string;
        };
      };
      ai_reports: {
        Row: {
          report_id: string;
          conversation_id: string;
          user_id: string;
          title: string;
          type: string;
          content: any;
          file_url: string | null;
          created_at: string;
        };
        Insert: {
          report_id?: string;
          conversation_id: string;
          user_id: string;
          title: string;
          type: string;
          content: any;
          file_url?: string | null;
          created_at?: string;
        };
        Update: {
          report_id?: string;
          conversation_id?: string;
          user_id?: string;
          title?: string;
          type?: string;
          content?: any;
          file_url?: string | null;
          created_at?: string;
        };
      };
      specialist_consultation_links: {
        Row: {
          id: string;
          patient_id: string;
          consultation_token: string;
          created_at: string;
          expires_at: string;
          is_used: boolean;
        };
        Insert: {
          id?: string;
          patient_id: string;
          consultation_token: string;
          created_at?: string;
          expires_at: string;
          is_used?: boolean;
        };
        Update: {
          id?: string;
          patient_id?: string;
          consultation_token?: string;
          created_at?: string;
          expires_at?: string;
          is_used?: boolean;
        };
      };
      specialist_consultations: {
        Row: {
          id: string;
          consultation_link_id: string;
          specialist_name: string;
          specialist_credentials: string;
          specialty: string;
          consultation_notes: string;
          recommendations: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          consultation_link_id: string;
          specialist_name: string;
          specialist_credentials: string;
          specialty: string;
          consultation_notes: string;
          recommendations: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          consultation_link_id?: string;
          specialist_name?: string;
          specialist_credentials?: string;
          specialty?: string;
          consultation_notes?: string;
          recommendations?: string;
          created_at?: string;
        };
      };
    };
    Views: {
      ai_patient_data: {
        Row: {
          id: string;
          created_at: string;
          year: number;
          month: number;
          response: any;
          risk_level: string;
          total_score: number;
        };
      };
    };
  };
}

// Helper type for working with Supabase tables
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];

// Helper type for working with Supabase views
export type Views<T extends keyof Database['public']['Views']> = Database['public']['Views'][T]['Row'];
