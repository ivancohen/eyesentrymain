# Address Fields Migration Guide

This guide explains how to run the address fields migration that enhances the platform with structured address data.

## Migration Options

There are three migration scripts available:

1. `add_address_fields_ultra_simple.sql` - **RECOMMENDED**: The most reliable, error-free approach
2. `add_address_fields_simplified.sql` - A more comprehensive script with detailed error handling
3. `add_address_fields.sql` - The original migration script (more complex)
4. `update_address_references.sql` - A companion script for backward compatibility

## Recommended Approach: Ultra Simple Migration

The ultra-simple script is the most reliable option with minimal complexity:

```bash
psql -f supabase/add_address_fields_ultra_simple.sql
```

This script:
- Uses simple SQL statements that work across PostgreSQL versions
- Includes only essential operations for adding address fields
- Handles errors gracefully with minimal dependencies
- Avoids referencing columns that might not exist
- Safely adds the new address field columns
- Properly checks for existing columns before modifications
- Handles data migration from existing address data
- Updates RLS policies appropriately
- Creates a new `get_pending_doctors_new()` function
- Updates views conditionally based on what columns exist
- Provides detailed progress information

## Alternative: Two-Step Migration

If you prefer a more cautious approach:

### Step 1: Run the Main Migration

```bash
psql -f supabase/add_address_fields.sql
```

### Step 2: Run the References Update

```bash
psql -f supabase/update_address_references.sql
```

## Troubleshooting

### If the migration fails:

1. Check for syntax errors in the error message
2. Verify PostgreSQL version compatibility (9.6+)
3. Use the `-v ON_ERROR_STOP=1` flag to stop at the first error:
   ```bash
   psql -v ON_ERROR_STOP=1 -f supabase/add_address_fields_simplified.sql
   ```

### Common issues and solutions:

#### Column does not exist errors:
This usually happens when the script tries to reference a column that doesn't exist in your database version. The simplified migration script handles this automatically by checking for column existence.

#### Function or view dependency errors:
The script handles dependencies with CASCADE operations, but if you need to manually clean up:

```sql
DROP FUNCTION IF EXISTS get_pending_doctors() CASCADE;
DROP VIEW IF EXISTS pending_doctor_approvals_no_role CASCADE;
```

## Code Updates

After migration, update any code that uses `get_pending_doctors()` to either:

1. `get_pending_doctors_new()` (recommended, simpler interface)
2. Continue using `get_pending_doctors()` (maintained for backward compatibility)

## Verification

To verify the migration was successful:

```sql
-- Check if new columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'profiles'
AND column_name IN ('street_address', 'city', 'state', 'zip_code');

-- Check if views exist
SELECT table_name FROM information_schema.views
WHERE table_schema = 'public' 
AND table_name IN ('pending_doctor_approvals_no_role', 'admin_patient_view_no_role');

-- Check if functions exist
SELECT proname FROM pg_proc
WHERE proname IN ('get_pending_doctors_new', 'get_pending_doctors')
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
```
