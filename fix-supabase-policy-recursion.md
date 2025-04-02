# Fixing Infinite Recursion in Supabase Policies

## Problem Identified

The root cause of the 500 errors has been identified as:

```
Database error: infinite recursion detected in policy for relation "profiles"
```

This indicates that there's a recursive Row Level Security (RLS) policy on the `profiles` table in your Supabase database. This happens when a policy references itself directly or indirectly, creating an infinite loop.

## How to Fix the Database Policy

### 1. Access the Supabase Dashboard

1. Log in to your Supabase dashboard at https://app.supabase.io/
2. Select your project (`gebojeuaeaqmdfrxptqf`)
3. Navigate to the SQL Editor

### 2. Identify the Problematic Policy

Run this SQL to list all policies on the profiles table:

```sql
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM
  pg_policies
WHERE
  tablename = 'profiles';
```

### 3. Fix the Recursive Policy

Once you've identified the problematic policy, you need to modify or replace it. Here's an example fix:

```sql
-- First, drop the problematic policy
DROP POLICY IF EXISTS "policy_name_here" ON "public"."profiles";

-- Then create a new, non-recursive policy
CREATE POLICY "profiles_select_policy" 
ON "public"."profiles"
FOR SELECT
USING (
  -- Simple condition that doesn't cause recursion
  auth.uid() = id OR 
  -- For admins to see all profiles
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.raw_app_meta_data->>'role' = 'admin'
  )
);

-- Create separate policies for other operations if needed
CREATE POLICY "profiles_insert_policy" 
ON "public"."profiles"
FOR INSERT
WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_policy" 
ON "public"."profiles"
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);
```

### 4. Common Causes of Recursion in Policies

1. **Self-referential queries**: A policy that queries the same table it's protecting
2. **Circular references**: Multiple policies that reference each other
3. **Complex joins**: Policies with joins that eventually lead back to the original table
4. **Subqueries that reference the parent table**: Using the same table in a subquery

### 5. Testing the Fix

After applying the fix:

1. Run a simple query to test:
   ```sql
   SELECT * FROM profiles LIMIT 1;
   ```

2. If successful, try the application again to confirm the 500 errors are resolved

## Temporary Workaround

While you're fixing the database policy, our application-level error handling will continue to provide fallback functionality, ensuring users can still use the application even with the database issues.

## Long-term Solution

For a more robust long-term solution:

1. **Audit all RLS policies**: Review all policies for potential recursion issues
2. **Simplify complex policies**: Break down complex policies into simpler ones
3. **Use views**: For complex access patterns, consider using views instead of complex policies
4. **Test policies thoroughly**: Before deploying to production, test all policies with various user roles

## Additional Resources

- [Supabase Row Level Security Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL Policy Documentation](https://www.postgresql.org/docs/current/sql-createpolicy.html)
- [Debugging PostgreSQL Policies](https://supabase.com/blog/postgres-policies)