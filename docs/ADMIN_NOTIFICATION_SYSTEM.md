# Admin Notification System

This document provides documentation for EyeSentry's Admin Notification System, which is used for real-time administrative alerts, particularly for doctor approval workflows.

## Overview

The Admin Notification System provides:

1. Persistent storage of notifications in a database table
2. Real-time notification delivery using PostgreSQL's NOTIFY system
3. Email notifications to administrators
4. A clean API for frontend components to display notifications
5. Proper error handling and database dependency management

## Key Components

### 1. Database Schema

- **`admin_notifications`** table: Stores all notifications with their metadata
- **`admin_notification_view`** view: Provides formatted notification data
- Helper functions for safe data access

### 2. SQL Functions

| Function | Purpose |
|----------|---------|
| `notify_admins_new_doctor` | Sends notifications about new doctor registrations |
| `get_admin_notifications` | Safely retrieves formatted notifications |
| `mark_notification_read` | Marks a notification as read |

### 3. Frontend Components

- `AdminNotifications.tsx`: React component that displays notifications
- Real-time subscription to notification events

## Implementation Order

The SQL scripts must be run in the correct order to avoid dependency issues:

1. **First**: Run `admin_notification_table.sql` to create the table
2. **Second**: Run `admin_notification_function_complete.sql` to create the notification function
3. **Third**: Run `admin_notification_view.sql` to create the view and helper functions

**Alternatively**: Run the all-in-one `admin_notification_system.sql` script which handles everything in the correct order.

## Common Issues Fixed

### 1. Table/View Dependency Issues

The original code attempted to create a view that referenced a table before ensuring the table existed. This has been fixed by:

- Creating the table first, before any other objects
- Adding existence checks in all functions
- Using proper error handling

### 2. String Concatenation in JSON Context

The original code used the `||` operator for string concatenation in a context that was being treated as JSON, causing syntax errors:

```sql
-- Problematic code
CASE 
  WHEN an.type = 'new_doctor_registration' THEN 
    'New doctor registration: ' || an.content->>'doctor_name'  -- Error: invalid input syntax for type json
```

This has been fixed by using PostgreSQL's `concat()` function instead:

```sql
-- Fixed code
CASE 
  WHEN an.type = 'new_doctor_registration' THEN 
    concat('New doctor registration: ', an.content->>'doctor_name')
```

### 3. Error Handling For Missing Tables

The system now checks for table existence before attempting operations, making it robust against schemas being in different states.

## Frontend Integration

To use the Admin Notification component:

1. Import the component:
   ```typescript
   import AdminNotifications from "@/components/admin/AdminNotifications";
   ```

2. Add it to your admin layout or navigation:
   ```tsx
   <div className="admin-header">
     <Logo />
     <div className="admin-nav-items">
       <AdminNotifications />
       <UserMenu />
     </div>
   </div>
   ```

The component automatically:
- Loads notifications from the database
- Subscribes to real-time updates
- Shows count of unread notifications
- Provides UI for marking notifications as read

## Troubleshooting

### View Creation Errors

If you see errors related to the view creation, such as:

```
ERROR: relation "admin_notifications" does not exist
LINE 147: admin_notifications an
```

This indicates the view is trying to reference a table that doesn't exist yet. Solution:

1. Run the `admin_notification_table.sql` script first
2. Then run the other scripts in order
3. Or simply run the all-in-one `admin_notification_system.sql` script

### JSON Syntax Errors

If you see errors like:

```
ERROR: 22P02: invalid input syntax for type json
LINE 116: 'New doctor registration: ' || an.content->>'doctor_name'
DETAIL: Token "New" is invalid.
```

This indicates string concatenation issues in JSON contexts. The fix is:

1. Replace `||` with `concat()` function
2. Use our fixed scripts which already implement this change

### Frontend Component TypeScript Errors

If you encounter TypeScript errors in the frontend component, ensure you have the correct interface defined:

```typescript
interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  content: Record<string, any>;
  related_id: string;
  is_read: boolean;
  created_at: string;
}
```

## Testing

You can test the notification system with:

```sql
SELECT notify_admins_new_doctor(
  '123e4567-e89b-12d3-a456-426614174000'::uuid, -- doctor_id
  'Dr. Jane Smith',                            -- doctor_name
  'jane.smith@example.com',                    -- doctor_email
  ARRAY['admin@eyesentry.com']                 -- admin_emails
);
```

This should create a notification record and trigger a real-time event.
