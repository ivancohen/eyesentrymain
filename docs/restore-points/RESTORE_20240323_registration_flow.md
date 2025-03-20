# Restore Point: Registration Flow (March 23, 2024)

## Overview
This restore point documents the registration flow after removing email verification references and simplifying the user experience. The system now focuses on admin approval for doctor accounts while maintaining a streamlined process for regular users.

## Key Files
- `src/pages/Register.tsx`: Main registration page component
- `src/contexts/AuthContext.tsx`: Authentication context and logic
- `src/components/AuthForm.tsx`: Registration form component

## Registration Flow

### Regular Users
1. **Registration Form**
   - Email
   - Password
   - Name

2. **Success State**
   ```
   [Green Checkmark Icon]
   Registration Successful!

   [Green Alert Box]
   Your account has been created successfully.

   Ready to start? Sign in
   ```

3. **Toast Notifications**
   - "Registration successful!"

### Doctor Users
1. **Registration Form**
   - Email
   - Password
   - Name
   - Doctor Name
   - Phone Number
   - Address (Street, City, State, ZIP)
   - Specialty

2. **Success State**
   ```
   [Green Checkmark Icon]
   Registration Successful!

   [Amber Alert Box]
   Your doctor account requires approval
   Your account will need to be approved by an administrator 
   before you can access the doctor dashboard. This usually takes 1-2 business days.

   [Gray Card Box]
   What happens next?
   1. Our administrators have been notified of your registration
   2. Once approved, you'll receive a confirmation email
   3. You can then log in with your credentials

   Ready to start? Sign in
   ```

3. **Toast Notifications**
   - "Registration successful! Your account will require admin approval."
   - Followed by "Admins have been notified about your registration" (after 2 seconds)

## Admin Notification System
- Admins receive notifications through the AdminNotifications component
- New doctor registrations trigger real-time notifications
- Admins can approve/reject from the admin dashboard

## Database Schema
### profiles
- id: UUID (PK)
- email: string
- name: string
- is_admin: boolean
- created_at: timestamp
- avatar_url: string (optional)

### doctor_approvals
- id: UUID (PK)
- doctor_id: UUID (FK to profiles)
- status: string (pending/approved/rejected)
- approved_by: UUID (FK to profiles)
- created_at: timestamp
- updated_at: timestamp

## Rollback Instructions
To restore to this point:
1. Revert Register.tsx to commit [COMMIT_HASH]
2. Ensure AuthContext.tsx maintains the registration logic
3. Verify admin notification system is intact
4. Test both regular and doctor registration flows

## Testing Checklist
- [ ] Regular user registration completes without email verification
- [ ] Doctor registration shows admin approval message
- [ ] Admin notifications are received for new doctor registrations
- [ ] Success states display correctly for both user types
- [ ] Toast notifications appear in correct sequence
- [ ] Navigation to login works from success state

## Known Issues
None at this point. All email verification references have been removed and the flow has been streamlined. 