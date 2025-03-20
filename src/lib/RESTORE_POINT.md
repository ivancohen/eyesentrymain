# Supabase Client Migration Restore Point

## Current State (March 20, 2024)

### Supabase Client Location
- Main client file: `src/lib/supabase.ts`
- Backup file: `src/lib/supabase.backup.ts`

### Client Configuration
```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
export const getSupabaseClient = () => supabase;
```

### Files Using Supabase Client
1. Services:
   - `src/services/SpecialistConsultationService.ts`
   - `src/services/AdminService.ts`
   - `src/services/AnalyticsService.ts`
   - `src/services/PatientQuestionnaireService.ts`
   - `src/services/QuestionService.ts`
   - `src/services/RiskAssessmentService.ts`
   - `src/services/NewAdminService.ts`
   - `src/services/FixedAdminService.ts`
   - `src/services/EmergencyAdminService.ts`
   - `src/services/AIAssistantService.ts`

2. Utils:
   - `src/utils/insert-sample-questions.js`
   - `src/utils/import-questionnaire-questions.js`
   - `src/utils/add-sample-categorized-questions.js`

3. Pages:
   - `src/pages/Questionnaires.tsx`
   - `src/pages/ResetConfirmation.tsx`
   - `src/pages/UserProfile.tsx`
   - `src/pages/Register.tsx`
   - `src/pages/PendingApproval.tsx`
   - `src/pages/PasswordReset.tsx`
   - `src/pages/Login.tsx`

4. Components:
   - `src/components/SupabaseStatus.tsx`
   - `src/components/admin/AdminNotifications.tsx`
   - `src/components/admin/UserManagement.tsx`

5. Contexts:
   - `src/contexts/AuthContext.tsx`

### Known Issues
1. TypeScript errors in `src/services/__tests__/SpecialistConsultationService.test.ts`
2. Some files still using old import paths (supabase-client)

### Migration Status
- Main client file is properly configured
- Most files updated to use new import path
- Need to fix remaining TypeScript errors and old import paths 