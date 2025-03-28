# Restore Point: Questionnaire & Doctor Approval (March 26, 2024)

## Overview
This restore point documents the state before fixing two critical issues in the EyeSentry application:
1. Doctor Approval Status Checking - 404 error when calling the `check_doctor_approval_status` function
2. Patient Questionnaire Submission - Foreign key constraint errors when attempting to submit questionnaires

## Key Files
- `src/components/questionnaires/QuestionnaireForm.tsx`: Form component for questionnaires
- `src/components/questionnaires/QuestionnaireContainer.tsx`: Container component managing questionnaire state
- `src/services/PatientQuestionnaireService.ts`: Service for questionnaire submission and retrieval
- `src/constants/questionnaireConstants.ts`: Constants for questionnaire pages and questions

## Issues

### 1. Doctor Approval Status Checking
The application is trying to call a database function that doesn't exist:
```
Failed to load resource: the server responded with a status of 404 ()
Error checking approval status: Object
```

This occurs because the `check_doctor_approval_status` function is referenced in the code but not defined in the database.

### 2. Patient Questionnaire Submission
The questionnaire submission fails with a foreign key constraint error:
```
Error: insert or update on table "patient_questionnaires" violates foreign key constraint "patient_questionnaires_patient_id_fkey"
```

This is caused by a database schema issue where:
- The `patient_questionnaires` table requires a `patient_id` column
- This column has a foreign key constraint to another table
- The function tries to use the current user's ID as the patient ID, but this ID doesn't exist in the referenced table

## Database Schema

### patient_questionnaires (Current)
- id: UUID (PK)
- first_name: TEXT
- last_name: TEXT
- age: TEXT
- race: TEXT
- family_glaucoma: BOOLEAN
- ocular_steroid: BOOLEAN
- steroid_type: TEXT
- intravitreal: BOOLEAN
- intravitreal_type: TEXT
- systemic_steroid: BOOLEAN
- systemic_steroid_type: TEXT
- iop_baseline: BOOLEAN
- vertical_asymmetry: BOOLEAN
- vertical_ratio: BOOLEAN
- total_score: INTEGER
- risk_level: TEXT
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
- patient_id: UUID (FK with constraint causing the error)
- doctor_id: UUID (FK with potential constraint issues)

### doctor_approvals (Missing or Incomplete)
The doctor_approvals table and related functions need to be properly set up.

## Rollback Instructions
To restore to this point:
1. Revert any changes to the database schema
2. Remove any added functions: `check_doctor_approval_status`, `insert_patient_questionnaire`, etc.
3. Restore the original foreign key constraints if they were modified

## Testing Checklist
- [ ] Doctor approval status checking fails with 404 error
- [ ] Patient questionnaire submission fails with foreign key constraint error
- [ ] All UI components render correctly despite the errors

## Known Issues
1. Doctor approval status checking fails with 404 error
2. Patient questionnaire submission fails with foreign key constraint error