# Questionnaire Migration Checklist

This checklist provides a step-by-step guide for implementing the DB-driven questionnaire migration. Follow these steps in order to ensure a smooth transition from hardcoded questions to fully admin-controlled questions.

## Phase 1: Preparation

### Database Preparation
- [ ] Create a restore point using the SQL script in QUESTIONNAIRE_RESTORE_POINT_GUIDE.md
- [ ] Verify the restore point was created successfully
- [ ] Add the `status` column to the questions table if it doesn't exist
- [ ] Add the `is_active` column to the questions table if it doesn't exist
- [ ] Create necessary database indexes for performance:
  - [ ] `CREATE INDEX IF NOT EXISTS idx_questions_question ON public.questions(question);`
  - [ ] `CREATE INDEX IF NOT EXISTS idx_questions_created_by ON public.questions(created_by);`
  - [ ] `CREATE INDEX IF NOT EXISTS idx_questions_page_category ON public.questions(page_category);`
  - [ ] `CREATE INDEX IF NOT EXISTS idx_questions_status ON public.questions(status);`

### Code Backup
- [ ] Create git branches or local backups of key files:
  - [ ] `src/components/questionnaires/QuestionnaireForm.tsx`
  - [ ] `src/services/PatientQuestionnaireService.ts`
  - [ ] `src/components/questionnaires/QuestionnaireEdit.tsx`
  - [ ] `src/constants/questionnaireConstants.ts`

## Phase 2: Database Updates

### Question Status Update
- [ ] Set all active questions to have `status = 'Active'`
- [ ] Set all duplicate questions to have `status = 'Inactive'`
- [ ] Ensure the IOP Baseline question with tooltip has `status = 'Active'`
- [ ] Verify question statuses with:
  ```sql
  SELECT question, status, COUNT(*) 
  FROM questions 
  GROUP BY question, status 
  ORDER BY question;
  ```

### Question Type Verification
- [ ] Ensure all text input questions have `question_type = 'text'`
- [ ] Verify First Name and Last Name questions have `question_type = 'text'`
- [ ] Check question types with:
  ```sql
  SELECT question, question_type, COUNT(*) 
  FROM questions 
  GROUP BY question, question_type 
  ORDER BY question;
  ```

### Risk Score Setup
- [ ] Ensure all questions have a `risk_score` value set
- [ ] Set default risk scores for questions without one:
  ```sql
  UPDATE questions 
  SET risk_score = 1 
  WHERE risk_score IS NULL OR risk_score = 0;
  ```

## Phase 3: Code Updates

### QuestionnaireForm Component
- [ ] Update question fetching to only get active questions
- [ ] Implement question deduplication logic
- [ ] Fix question type handling for text inputs
- [ ] Ensure tooltips are properly displayed
- [ ] Add logging for debugging
- [ ] Test the form with various question types

### PatientQuestionnaireService
- [ ] Update risk score calculation to handle different answer types
- [ ] Implement deduplication for risk assessment
- [ ] Improve display of risk factors with descriptive answers
- [ ] Add special handling for known questions (e.g., IOP Baseline)
- [ ] Add comprehensive logging for debugging

### QuestionnaireEdit Component
- [ ] Update to properly populate answers from saved questionnaires
- [ ] Ensure text fields are correctly displayed as text inputs
- [ ] Fix any issues with answer formatting

## Phase 4: Testing

### Basic Functionality
- [ ] Verify form loads without errors
- [ ] Check that only active questions appear
- [ ] Confirm no duplicate questions are shown
- [ ] Ensure text fields render as text inputs
- [ ] Verify dropdowns render correctly

### Admin-Created Questions
- [ ] Create a new question in the admin panel
- [ ] Verify it appears in the patient questionnaire
- [ ] Check that its tooltip is displayed correctly
- [ ] Confirm it contributes to the risk score

### Risk Assessment
- [ ] Complete a questionnaire with various answers
- [ ] Verify risk score is calculated correctly
- [ ] Check that all contributing factors are displayed
- [ ] Confirm admin-created questions are included in the assessment

### Edit Functionality
- [ ] Create and save a questionnaire
- [ ] Edit the saved questionnaire
- [ ] Verify all answers are populated correctly
- [ ] Confirm text inputs display the saved text

## Phase 5: Deployment

### Pre-Deployment
- [ ] Run a final test of all functionality
- [ ] Verify database indexes are in place
- [ ] Check that all logging is appropriate for production
- [ ] Ensure the restore function works correctly

### Deployment
- [ ] Deploy database changes first
- [ ] Deploy code changes
- [ ] Monitor for any errors
- [ ] Test the deployed application

### Post-Deployment
- [ ] Verify all functionality in production
- [ ] Check server logs for any errors
- [ ] Monitor performance
- [ ] Document any issues for follow-up

## Rollback Plan

If issues are encountered:

1. Execute the restore function:
   ```sql
   SELECT restore_questionnaire_system();
   ```

2. Revert code changes:
   ```bash
   git checkout -- src/components/questionnaires/QuestionnaireForm.tsx
   git checkout -- src/services/PatientQuestionnaireService.ts
   git checkout -- src/components/questionnaires/QuestionnaireEdit.tsx
   ```

3. Restart the application

## Special Considerations

### IOP Baseline Question
- [ ] Verify the correct version with tooltip is active
- [ ] Ensure the old version is marked as inactive
- [ ] Check that it's properly included in risk assessment

### First Name and Last Name Fields
- [ ] Confirm they render as text inputs
- [ ] Verify they're properly saved
- [ ] Check they're correctly populated in edit mode

### Risk Score Calculation
- [ ] Ensure no duplicate scoring from duplicate questions
- [ ] Verify all answer types contribute correctly to the score
- [ ] Confirm the risk level thresholds are appropriate