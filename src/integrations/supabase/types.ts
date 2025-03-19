export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      categories: {
        Row: {
          created_at: string
          id: number
        }
        Insert: {
          created_at?: string
          id?: number
        }
        Update: {
          created_at?: string
          id?: number
        }
        Relationships: []
      }
      conditional_items: {
        Row: {
          condition_type: string
          condition_value: string
          created_at: string | null
          id: string
          question_id: string | null
          response_message: string
          score: number | null
        }
        Insert: {
          condition_type: string
          condition_value: string
          created_at?: string | null
          id?: string
          question_id?: string | null
          response_message: string
          score?: number | null
        }
        Update: {
          condition_type?: string
          condition_value?: string
          created_at?: string | null
          id?: string
          question_id?: string | null
          response_message?: string
          score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "conditional_items_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "question_scores_view"
            referencedColumns: ["question_id"]
          },
          {
            foreignKeyName: "conditional_items_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      data_items: {
        Row: {
          created_at: string
          id: number
        }
        Insert: {
          created_at?: string
          id?: number
        }
        Update: {
          created_at?: string
          id?: number
        }
        Relationships: []
      }
      dropdown_options: {
        Row: {
          created_at: string | null
          id: string
          option_text: string
          option_value: string
          question_id: string | null
          score: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          option_text: string
          option_value: string
          question_id?: string | null
          score?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          option_text?: string
          option_value?: string
          question_id?: string | null
          score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "dropdown_options_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "question_scores_view"
            referencedColumns: ["question_id"]
          },
          {
            foreignKeyName: "dropdown_options_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_questionnaires: {
        Row: {
          age: string
          created_at: string
          family_glaucoma: boolean
          first_name: string
          id: string
          intravitreal: boolean
          intravitreal_type: string | null
          iop_baseline: boolean
          last_name: string
          ocular_steroid: boolean
          race: string
          risk_level: string
          steroid_type: string | null
          systemic_steroid: boolean
          systemic_steroid_type: string | null
          total_score: number
          updated_at: string
          user_id: string
          vertical_asymmetry: boolean
          vertical_ratio: boolean
        }
        Insert: {
          age: string
          created_at?: string
          family_glaucoma: boolean
          first_name: string
          id?: string
          intravitreal: boolean
          intravitreal_type?: string | null
          iop_baseline: boolean
          last_name: string
          ocular_steroid: boolean
          race: string
          risk_level?: string
          steroid_type?: string | null
          systemic_steroid: boolean
          systemic_steroid_type?: string | null
          total_score?: number
          updated_at?: string
          user_id: string
          vertical_asymmetry: boolean
          vertical_ratio: boolean
        }
        Update: {
          age?: string
          created_at?: string
          family_glaucoma?: boolean
          first_name?: string
          id?: string
          intravitreal?: boolean
          intravitreal_type?: string | null
          iop_baseline?: boolean
          last_name?: string
          ocular_steroid?: boolean
          race?: string
          risk_level?: string
          steroid_type?: string | null
          systemic_steroid?: boolean
          systemic_steroid_type?: string | null
          total_score?: number
          updated_at?: string
          user_id?: string
          vertical_asymmetry?: boolean
          vertical_ratio?: boolean
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          id: string
          is_admin: boolean | null
          name: string | null
          role_name: string | null
          status: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          id: string
          is_admin?: boolean | null
          name?: string | null
          role_name?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          id?: string
          is_admin?: boolean | null
          name?: string | null
          role_name?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      questions: {
        Row: {
          category: string | null
          created_at: string
          created_by: string
          followup_date: string | null
          has_conditional_items: boolean | null
          has_dropdown_options: boolean | null
          has_dropdown_scoring: boolean | null
          has_score: boolean | null
          id: string
          question: string
          question_type: string | null
          requires_followup: boolean | null
          status: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          created_by: string
          followup_date?: string | null
          has_conditional_items?: boolean | null
          has_dropdown_options?: boolean | null
          has_dropdown_scoring?: boolean | null
          has_score?: boolean | null
          id?: string
          question: string
          question_type?: string | null
          requires_followup?: boolean | null
          status?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          created_by?: string
          followup_date?: string | null
          has_conditional_items?: boolean | null
          has_dropdown_options?: boolean | null
          has_dropdown_scoring?: boolean | null
          has_score?: boolean | null
          id?: string
          question?: string
          question_type?: string | null
          requires_followup?: boolean | null
          status?: string | null
        }
        Relationships: []
      }
      user_input_data_items: {
        Row: {
          created_at: string
          id: number
          user_id: string
          user_input: string
        }
        Insert: {
          created_at?: string
          id?: number
          user_id: string
          user_input: string
        }
        Update: {
          created_at?: string
          id?: number
          user_id?: string
          user_input?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          created_at: string
          id: number
        }
        Insert: {
          created_at?: string
          id?: number
        }
        Update: {
          created_at?: string
          id?: number
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string
          id: number
        }
        Insert: {
          created_at?: string
          id?: number
        }
        Update: {
          created_at?: string
          id?: number
        }
        Relationships: []
      }
    }
    Views: {
      admin_access_status: {
        Row: {
          conditional_items_count: number | null
          dropdown_options_count: number | null
          email: string | null
          is_admin: boolean | null
          profiles_count: number | null
          questions_count: number | null
          role_name: string | null
        }
        Insert: {
          conditional_items_count?: never
          dropdown_options_count?: never
          email?: string | null
          is_admin?: boolean | null
          profiles_count?: never
          questions_count?: never
          role_name?: string | null
        }
        Update: {
          conditional_items_count?: never
          dropdown_options_count?: never
          email?: string | null
          is_admin?: boolean | null
          profiles_count?: never
          questions_count?: never
          role_name?: string | null
        }
        Relationships: []
      }
      admin_access_view: {
        Row: {
          email: string | null
          has_conditional_items_access: boolean | null
          has_dropdown_options_access: boolean | null
          has_profile_access: boolean | null
          has_question_access: boolean | null
          is_admin: boolean | null
          role_name: string | null
        }
        Insert: {
          email?: string | null
          has_conditional_items_access?: never
          has_dropdown_options_access?: never
          has_profile_access?: never
          has_question_access?: never
          is_admin?: boolean | null
          role_name?: string | null
        }
        Update: {
          email?: string | null
          has_conditional_items_access?: never
          has_dropdown_options_access?: never
          has_profile_access?: never
          has_question_access?: never
          is_admin?: boolean | null
          role_name?: string | null
        }
        Relationships: []
      }
      anonymous_patient_data: {
        Row: {
          age: string | null
          created_at: string | null
          family_glaucoma: boolean | null
          id: string | null
          intravitreal: boolean | null
          iop_baseline: boolean | null
          ocular_steroid: boolean | null
          race: string | null
          risk_level: string | null
          systemic_steroid: boolean | null
          total_score: number | null
          vertical_asymmetry: boolean | null
          vertical_ratio: boolean | null
        }
        Insert: {
          age?: string | null
          created_at?: string | null
          family_glaucoma?: boolean | null
          id?: string | null
          intravitreal?: boolean | null
          iop_baseline?: boolean | null
          ocular_steroid?: boolean | null
          race?: string | null
          risk_level?: string | null
          systemic_steroid?: boolean | null
          total_score?: number | null
          vertical_asymmetry?: boolean | null
          vertical_ratio?: boolean | null
        }
        Update: {
          age?: string | null
          created_at?: string | null
          family_glaucoma?: boolean | null
          id?: string | null
          intravitreal?: boolean | null
          iop_baseline?: boolean | null
          ocular_steroid?: boolean | null
          race?: string | null
          risk_level?: string | null
          systemic_steroid?: boolean | null
          total_score?: number | null
          vertical_asymmetry?: boolean | null
          vertical_ratio?: boolean | null
        }
        Relationships: []
      }
      question_scores_view: {
        Row: {
          condition_value: string | null
          conditional_item_id: string | null
          conditional_score: number | null
          dropdown_score: number | null
          option_id: string | null
          option_text: string | null
          question: string | null
          question_id: string | null
          question_type: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      approve_user_registration: {
        Args: {
          user_email: string
          new_status: string
          admin_user_id: string
        }
        Returns: boolean
      }
      check_admin_access: {
        Args: {
          user_id: string
        }
        Returns: boolean
      }
      check_admin_access_secure: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      check_admin_status: {
        Args: {
          user_id: string
        }
        Returns: boolean
      }
      ensure_admin_database_access: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      get_all_users: {
        Args: Record<PropertyKey, never>
        Returns: {
          avatar_url: string | null
          created_at: string
          email: string
          id: string
          is_admin: boolean | null
          name: string | null
          role_name: string | null
          status: string
          updated_at: string
        }[]
      }
      get_patient_questionnaires_for_user: {
        Args: {
          user_id_param: string
        }
        Returns: {
          age: string
          created_at: string
          family_glaucoma: boolean
          first_name: string
          id: string
          intravitreal: boolean
          intravitreal_type: string | null
          iop_baseline: boolean
          last_name: string
          ocular_steroid: boolean
          race: string
          risk_level: string
          steroid_type: string | null
          systemic_steroid: boolean
          systemic_steroid_type: string | null
          total_score: number
          updated_at: string
          user_id: string
          vertical_asymmetry: boolean
          vertical_ratio: boolean
        }[]
      }
      get_user_questionnaire_access: {
        Args: {
          questionnaire_user_id: string
        }
        Returns: boolean
      }
      get_users_secure: {
        Args: Record<PropertyKey, never>
        Returns: {
          avatar_url: string | null
          created_at: string
          email: string
          id: string
          is_admin: boolean | null
          name: string | null
          role_name: string | null
          status: string
          updated_at: string
        }[]
      }
      grant_admin_database_access: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      insert_patient_questionnaire: {
        Args: {
          first_name: string
          last_name: string
          age: string
          race: string
          family_glaucoma: boolean
          ocular_steroid: boolean
          steroid_type: string
          intravitreal: boolean
          intravitreal_type: string
          systemic_steroid: boolean
          systemic_steroid_type: string
          iop_baseline: boolean
          vertical_asymmetry: boolean
          vertical_ratio: boolean
          total_score: number
          risk_level: string
        }
        Returns: string
      }
      is_admin_role: {
        Args: {
          user_email: string
        }
        Returns: boolean
      }
      set_user_admin_status: {
        Args: {
          user_email: string
          admin_status: boolean
        }
        Returns: boolean
      }
      super_admin_create_user: {
        Args: {
          user_email: string
          user_name: string
          user_is_admin: boolean
          user_id: string
        }
        Returns: boolean
      }
      super_admin_get_all_users: {
        Args: Record<PropertyKey, never>
        Returns: {
          avatar_url: string | null
          created_at: string
          email: string
          id: string
          is_admin: boolean | null
          name: string | null
          role_name: string | null
          status: string
          updated_at: string
        }[]
      }
      super_admin_set_admin_status: {
        Args: {
          user_email: string
          is_admin: boolean
        }
        Returns: boolean
      }
      super_admin_update_user: {
        Args: {
          user_id: string
          user_email: string
          user_name: string
          user_is_admin: boolean
        }
        Returns: boolean
      }
      super_admin_update_user_status: {
        Args: {
          user_email: string
          new_status: string
        }
        Returns: boolean
      }
      update_admin_status_secure: {
        Args: {
          target_email: string
          new_status: boolean
        }
        Returns: boolean
      }
      update_option_score: {
        Args: {
          option_type: string
          option_id: string
          new_score: number
        }
        Returns: boolean
      }
      update_patient_questionnaire: {
        Args: {
          questionnaire_id: string
          first_name: string
          last_name: string
          age: string
          race: string
          family_glaucoma: boolean
          ocular_steroid: boolean
          steroid_type: string
          intravitreal: boolean
          intravitreal_type: string
          systemic_steroid: boolean
          systemic_steroid_type: string
          iop_baseline: boolean
          vertical_asymmetry: boolean
          vertical_ratio: boolean
          total_score: number
          risk_level: string
        }
        Returns: boolean
      }
      update_user_approval_secure: {
        Args: {
          target_email: string
          new_status: string
        }
        Returns: boolean
      }
      verify_admin_database_access: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
