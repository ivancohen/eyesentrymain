# EyeSentry Codebase Index

This document provides an organized overview of the EyeSentry codebase structure and its components. It reflects the codebase as of March 20, 2025.

## Project Overview

EyeSentry appears to be a healthcare application with functionality for patient management, questionnaires, risk assessments, and specialist consultations. The application uses:

- React as the frontend framework
- Supabase for backend and database
- TypeScript for type-safe development
- Tailwind CSS for styling
- Vite as the build tool

## Core Structure

### Frontend Components

- **App Files**: `src/App.tsx`, `src/main.tsx` - Entry points for the React application
- **Pages**: `src/pages/` - Main page components
- **Components**: `src/components/` - Reusable UI components
- **UI Library**: `src/components/ui/` - Base UI components (likely using Shadcn UI)
- **Layout**: `src/components/layouts/` - Page layout components

### Backend & Data

- **Supabase Integration**: `src/lib/supabase.ts` - Client setup for Supabase
- **Services**: `src/services/` - API service modules for data operations
- **Database Migrations**: `supabase/migrations/` - SQL migrations for database schema changes
- **Types**: `src/types/` - TypeScript type definitions

### State Management & Context

- **Contexts**: `src/contexts/` - React context providers
- **Hooks**: `src/hooks/` - Custom React hooks

## Key Features

### Authentication & User Management

- **Auth Flow**: `src/contexts/AuthContext.tsx` - Manages user authentication state, login/logout, session management, and role-based authorization
  - Supports email/password and Google OAuth login
  - Role-based redirection (admin, doctor, patient)
  - Doctor approval workflow
  - Session refresh mechanism
- **Auth Components**: `src/components/AuthForm.tsx`
- **User Management**: `src/components/admin/UserManagement.tsx`
- **Admin Services**: `src/services/AdminService.ts`, `src/services/FixedAdminService.ts`, `src/services/NewAdminService.ts`

### Questionnaire System

- **Questionnaire Components**: `src/components/questionnaires/`
  - `QuestionnaireForm.tsx` - Form for creating/editing questionnaires
  - `QuestionnaireContainer.tsx` - Container component for questionnaire views
  - `QuestionnaireResults.tsx` - Displays completed questionnaire results
  - `QuestionnaireEdit.tsx` - Interface for editing existing questionnaires
- **Question Management**: `src/components/questions/`
  - `QuestionTable.tsx` - Tabular display of questions with management controls
- **Question Services**: 
  - `src/services/QuestionService.ts` - API calls for question CRUD operations
  - `src/services/QuestionnaireService.ts` - Handles submission and retrieval of patient questionnaires
- **Patient Questionnaires**: `src/services/PatientQuestionnaireService.ts`

### Specialist Consultation

- **Specialist Components**: `src/components/specialist/`
  - `SpecialistQuestionnaireForm.tsx` - Form for specialist input
- **Specialist Services**: 
  - `src/services/SpecialistService.ts`
  - `src/services/SpecialistConsultationService.ts` - Manages consultation links/tokens for specialists to access patient data
    - Generates secure consultation links with expiration dates
    - Validates consultation tokens
    - Handles submission of specialist consultations
- **Specialist Question Management**: `src/components/admin/SpecialistQuestionManager.tsx`
  - `src/components/admin/specialist/SpecialistQuestionForm.tsx`
  - `src/components/admin/specialist/SpecialistQuestionTable.tsx`

### Risk Assessment

- **Risk Assessment Pages**: `src/app/risk-assessment/page.tsx`, `src/app/admin/risk-assessment/page.tsx`
- **Risk Assessment Components**: `src/components/admin/RiskAssessmentAdmin.tsx`
- **Risk Assessment Service**: `src/services/RiskAssessmentService.ts` - Manages risk scores, configurations, and advice based on questionnaire answers
  - Calculates risk scores based on patient answers
  - Provides risk-based advice with configurable thresholds
  - Manages contributing factors to risk scores

### Patient Management

- **Patient Pages**: `src/pages/Patients.tsx`, `src/pages/PatientDetails.tsx`
- **Patient Components**: `src/components/patient/`
  - `PatientCard.tsx` - Card display for patient information
  - `SpecialistTab.tsx` - Tab for specialist consultation data

### Admin Features

- **Admin Dashboard**: `src/pages/Admin.tsx`
- **Admin Components**: `src/components/admin/`
  - `AdminNotifications.tsx` - System notifications for administrators
  - `RiskAssessmentAdmin.tsx` - Risk assessment configuration
  - `EnhancedQuestionManager.tsx` - Advanced question management interface
- **Notifications**: `src/components/admin/AdminNotifications.tsx`
- **AI Assistant**: `src/services/AIAssistantService.ts`

### Email Functionality

- **Email Service**: `src/services/EmailService.ts` - Handles email delivery using Resend API
  - Sends test emails
  - Delivers specialist access links with secure tokens
  - Uses HTML templates for email content

## Recent Database Changes

The database schema has undergone several changes as evidenced by the migration files:

### Major Recent Migrations

1. **Specialist Consultation** (March 20, 2024):
   - Added specialist consultation functionality

2. **Tooltips** (March 21, 2024):
   - Added tooltip support for questions

3. **Risk Assessment** (March 22, 2024):
   - Added risk assessment configuration

4. **Display Order & Registration** (March 23, 2024):
   - Added display order functionality
   - Implemented restoration point for registration flow
   - Added specialist access controls

5. **Patient Management & Fixes** (March 24, 2024):
   - Created patients table
   - Updated access code functionality
   - Added email functionality
   - Multiple fixes to RLS policies and permissions
   - Specialist question improvements

6. **Question Constraints** (March 25, 2024):
   - Added constraints to question management

## User Roles and Permissions

The application implements a role-based access control system:

- **Admin**: Can manage all aspects of the system, including user management, question configuration, and system settings
- **Doctor**: Medical professionals who can view patient data, create questionnaires, and request specialist consultations
- **Patient**: End users who can fill out questionnaires and view their own data
- **Specialist**: External consultants who can provide specialized input via secure links

## Utility Scripts

- **Admin Management**: Various scripts for admin role management (`make-brown-admin.js`, `fix-admin-function.bat/.sh`)
- **Data Import**: Scripts for importing sample questions and data
- **Emergency Fixes**: Scripts for handling emergency admin access issues

## Configuration Files

- **Project Config**: `package.json`, `tsconfig.json`, `vite.config.ts`, `tailwind.config.ts`
- **Supabase Config**: `supabase/config.toml`
- **Deployment Config**: `wrangler.toml`, `_routes.json`

## Documentation

- **General Docs**: Various markdown files in the `docs/` directory
  - `specialist-questionnaire.md` - Documentation for the specialist questionnaire system
  - `supabase-client-usage.md` - Guide for proper Supabase client usage
- **Restore Points**: `docs/restore-points/` containing restoration instructions
  - `RESTORE_20240323_registration_flow.md` - Registration flow restoration point
- **Implementation Guides**: Various `.md` files in the root directory

---

This index provides a high-level overview of the codebase structure. For more detailed information about specific components or features, please refer to the corresponding files or documentation.
