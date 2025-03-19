# Doctor Approval Workflow Implementation

This document outlines the doctor approval workflow implementation in the EyeSentry system.

> **IMPORTANT NOTICE:** When implementing this workflow, use the `*_fixed.sql` scripts:
> - `supabase/doctor_approval_check_function_fixed.sql` 
> - `supabase/doctor_approvals_setup_fixed.sql`
> - `supabase/admin_notification_function_fixed.sql`
> - `supabase/admin_notification_functions.sql`
>
> These scripts address duplicate function and policy issues, and implement admin notifications with proper table creation and helper functions.

## Overview

The doctor approval flow ensures that healthcare providers who register as doctors must be approved by administrators before they can access the platform with doctor privileges. This helps maintain the integrity and security of the platform by verifying the credentials of healthcare providers.

## Implementation Components

### Database Schema

1. **Doctor Approvals Table**
   - Located in `supabase/doctor_approvals_setup_fixed.sql`
   - Stores doctor approval requests with status (pending, approved, rejected)
   - Contains references to user ID and reviewer information
   - Includes timestamps for creation and update actions

2. **Admin Notifications Table**
   - Created automatically by `supabase/admin_notification_function.sql`
   - Stores notifications for administrators
   - Tracks notification status (read/unread)
   - Enables real-time updates via Supabase channels

3. **Database Functions**
   - `check_doctor_approval_status` - Located in `supabase/doctor_approval_check_function_fixed.sql`
   - `approve_doctor` - Function for admins to approve doctor accounts
   - `reject_doctor` - Function for admins to reject doctor accounts
   - `notify_admins_new_doctor` - Function to notify administrators of new doctor registrations
   - `get_admin_notifications` - Function to safely retrieve notifications
   - `mark_notification_read` - Function to mark notifications as read

   > **Important:** The function signatures have been updated to include parameter types for disambiguation, and helper functions added for error-resistant operation.

### Frontend Components

1. **Auth Context**
   - Located in `src/contexts/AuthContext.tsx`
   - Extends user profile with doctor-specific fields
   - Implements approval status checking
   - Handles proper routing based on user role and approval status
   - Logs doctors out immediately after registration to prevent auto-login

2. **Registration Flow**
   - Located in `src/pages/Register.tsx`
   - Detects doctor registrations
   - Sets appropriate metadata flags for doctor accounts
   - Shows detailed approval notification and next steps to doctors after registration
   - Indicates that admins have been notified about the registration

3. **Login Flow**
   - Located in `src/pages/Login.tsx`
   - Routes doctors to appropriate pages based on approval status
   - Prevents unapproved doctors from accessing doctor features

4. **Pending Approval Page**
   - Located in `src/pages/PendingApproval.tsx`
   - Displays status information to doctors awaiting approval
   - Auto-refreshes to check for status changes
   - Provides options to update profile or log out

5. **Admin Approval Interface**
   - Located in `src/components/admin/DoctorApprovals.tsx`
   - Lists doctors awaiting approval
   - Provides approve/reject functionality for administrators
   - Shows doctor details for verification

6. **Admin Notifications Component**
   - Located in `src/components/admin/AdminNotifications.tsx`
   - Shows real-time notifications about new doctor registrations
   - Integrated into the admin dashboard header
   - Provides quick access to pending approvals

## Workflow Process

1. **Registration**
   - Doctor fills out registration form including practice information
   - System identifies registration as doctor account
   - System signs out the doctor to prevent auto-login
   - Doctor sees detailed confirmation and next steps screen
   - Doctor receives email verification link
   - System creates `doctor_approvals` record with "pending" status

2. **Admin Notification**
   - System creates a notification record in `admin_notifications` table
   - Admins are notified in real-time via the AdminNotifications component
   - System sends email notifications to all admin users
   - Admin can view pending doctor approvals in admin panel

3. **Verification Process**
   - Admin reviews doctor information
   - Admin can approve or reject the doctor registration
   - Admin can add notes for rejection reasons if needed

4. **Post-Approval**
   - Doctor is notified of approval status
   - Approved doctors are redirected to doctor dashboard on next login
   - Rejected doctors can update their information and reapply

## How to Test

1. **Register as a Doctor**
   - Create a new account and select the doctor option
   - Complete the registration process
   - Verify that you are redirected to the email verification screen

2. **Verify Email**
   - Check email for verification link
   - Click the verification link
   - Login with your credentials
   - System should direct you to the pending approval page

3. **Admin Approval**
   - Login as an administrator
   - Navigate to Doctor Approvals section
   - Find the pending doctor account
   - Approve the doctor account

4. **Doctor Login**
   - Login as the doctor
   - You should now be directed to the doctor dashboard

## Troubleshooting

1. **Doctor Approval Status Not Updating**
   - Check database permissions for the approval functions
   - Verify that RLS policies are configured correctly
   - Ensure admin has appropriate permissions
   - If you receive the error `function name is not unique`, use the fixed SQL scripts that include parameter types in the function declarations

2. **SQL Function Errors**
   - If you encounter `function already exists with same argument types` errors, use the `DROP FUNCTION` statements in the fixed scripts
   - For policy errors like `policy already exists`, use the `DROP POLICY` statements first

2. **Admin Not Seeing Pending Approvals**
   - Check database view permissions
   - Verify the admin role assignment
   - Check for database function errors

3. **Doctor Not Redirected Properly**
   - Check the approval status in the doctor_approvals table
   - Verify the login flow is calling the correct status check function
   - Ensure routing is set up correctly in App.tsx
