export type QuestionType = 'text' | 'select' | 'multiline' | 'number';

export interface SpecialistQuestion {
    id: string;
    question: string;
    question_type: QuestionType;
    display_order: number;
    created_at: string;
    created_by?: string;
    is_active: boolean;
    required: boolean;
    dropdown_options?: string[];
}

export interface SpecialistResponse {
    id: string;
    patient_id: string;
    question_id: string;
    response: string;
    created_at: string;
    question?: SpecialistQuestion;
}

export interface PatientAccessCode {
    id: string;
    patient_id: string;
    access_code: string;
    created_at: string;
    created_by?: string;
    expires_at: string;
    is_active: boolean;
}

export interface SpecialistSubmission {
    patient_id: string;
    access_code: string;
    responses: Array<{
        question_id: string;
        response: string;
    }>;
} 