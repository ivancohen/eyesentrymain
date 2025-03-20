# Specialist Questionnaire Feature

## Overview
The specialist questionnaire feature allows doctors to share patient information with specialists for assessment. Specialists can access a secure form to provide their assessment, which is then displayed in the patient's record.

## Database Schema

### Tables

#### specialist_questions
- `id`: UUID (Primary Key)
- `question`: Text
- `question_type`: Enum ('text', 'select', 'multiline', 'number')
- `display_order`: Integer
- `created_at`: Timestamp
- `created_by`: UUID (Foreign Key to auth.users)
- `is_active`: Boolean
- `required`: Boolean
- `dropdown_options`: Text Array (for select type questions)

#### specialist_responses
- `id`: UUID (Primary Key)
- `patient_id`: UUID (Foreign Key to patients)
- `question_id`: UUID (Foreign Key to specialist_questions)
- `response`: Text
- `created_at`: Timestamp

#### patient_access_codes
- `id`: UUID (Primary Key)
- `patient_id`: UUID (Foreign Key to patients)
- `access_code`: Text
- `created_at`: Timestamp
- `created_by`: UUID (Foreign Key to auth.users)
- `expires_at`: Timestamp
- `is_active`: Boolean

## Row Level Security (RLS) Policies

### specialist_questions
- Anonymous users can view active questions
- Authenticated users can view and manage questions

### specialist_responses
- Anonymous users can insert responses
- Authenticated users can view and manage responses

## Frontend Components

### SpecialistQuestionnaireForm
Located in `src/components/specialist/SpecialistQuestionnaireForm.tsx`
- Handles the specialist's questionnaire interface
- Supports multiple question types (text, select, multiline, number)
- Validates required questions
- Submits responses to the database

### SpecialistTab
Located in `src/components/patient/SpecialistTab.tsx`
- Displays specialist responses in the patient card
- Groups responses by date
- Provides access code generation and sharing functionality
- Supports email sharing of access links

## Services

### SpecialistService
Located in `src/services/SpecialistService.ts`
- Manages specialist questions and responses
- Handles access code generation and validation
- Provides email functionality for sharing access links

## API Endpoints

### Questions
- `GET /specialist_questions`: Get active questions
- `POST /specialist_questions`: Create new question (admin only)
- `PUT /specialist_questions/:id`: Update question (admin only)
- `DELETE /specialist_questions/:id`: Soft delete question (admin only)

### Responses
- `POST /specialist_responses`: Submit specialist responses
- `GET /specialist_responses`: Get patient responses (authenticated only)

### Access Codes
- `POST /patient_access_codes`: Generate access code (authenticated only)
- `GET /patient_access_codes/validate`: Validate access code

## Usage Flow

1. Doctor generates an access code for a patient
2. Doctor shares the access code with a specialist (via email or direct link)
3. Specialist accesses the questionnaire using the code
4. Specialist completes and submits the questionnaire
5. Doctor views the specialist's responses in the patient's record

## Security Considerations
- Access codes expire after a set period
- Only active questions are displayed
- Responses are tied to specific patients and access codes
- RLS policies ensure proper access control
- Email sharing requires authentication

## Future Improvements
1. Add response export functionality
2. Implement response filtering and search
3. Add specialist information collection
4. Support file attachments in responses
5. Add response notifications for doctors 