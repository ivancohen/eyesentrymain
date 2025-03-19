# Analytics Dashboard Setup Instructions

The Analytics Dashboard provides administrators with the ability to analyze patient questionnaire data anonymously, identifying trends and risk factors without exposing patient identifying information.

## Issue Detection

If you're seeing 404 errors in the browser console like:
```
Failed to load resource: the server responded with a status of 404 ()
Error fetching questionnaire summary: Object
Error fetching submission trend: Object
```

This indicates that the SQL functions required by the analytics dashboard haven't been deployed to your Supabase database yet.

## Setup Instructions

Follow these steps to set up the analytics dashboard functionality:

### 1. Install SQL Functions

You need to execute the SQL functions in your Supabase database. There are three ways to do this:

#### Option 1: Using the Supabase Dashboard

1. Log in to your [Supabase Dashboard](https://app.supabase.io)
2. Select your project
3. Go to the SQL Editor tab
4. Open the file `eyesentry/supabase/create_analytics_functions.sql` from this project
5. Copy the entire content of the file
6. Paste it into a new SQL query in the Supabase SQL Editor
7. Click "Run" to execute the SQL

#### Option 2: Using the Supabase CLI

If you have the Supabase CLI installed, you can run:

```bash
supabase db push -f eyesentry/supabase/create_analytics_functions.sql
```

#### Option 3: Using psql

If you have direct access to the database via psql:

```bash
psql -h YOUR_SUPABASE_HOST -U postgres -d postgres -f eyesentry/supabase/create_analytics_functions.sql
```

### 2. Verify Function Installation

After installing the functions, you can verify they were successfully installed by:

1. Going to the Supabase Dashboard
2. Navigating to Database > Functions
3. You should see functions like:
   - `get_questionnaire_summary`
   - `get_risk_factor_distribution`
   - `get_risk_level_distribution`
   - `get_age_distribution`
   - `get_submission_trend`
   - And others

### 3. Test the Dashboard

Once the functions are installed, return to your application and navigate to:
1. Admin Dashboard
2. Click on "Analytics" in the sidebar

The dashboard should now load correctly without 404 errors.

## Troubleshooting

If you're still experiencing issues after installing the functions:

1. **Check Permissions**: Ensure that the authenticated role has permission to execute the functions. In the SQL, we've included:
   ```sql
   GRANT EXECUTE ON FUNCTION public.get_anonymized_questionnaire_data TO authenticated;
   ```
   For each function. Make sure these GRANT statements were executed.

2. **Check for Errors**: In the Supabase SQL Editor, run:
   ```sql
   SELECT routine_name 
   FROM information_schema.routines 
   WHERE routine_type = 'FUNCTION' 
   AND routine_schema = 'public';
   ```
   This will list all functions in the public schema. Confirm that our analytics functions are listed.

3. **Check Console for Detailed Errors**: The browser developer console may have more detailed error messages beyond the 404 status.

## Data Privacy

The analytics functions are designed with privacy in mind:
- No patient names are included in the returned data
- All data is aggregated or anonymized
- Functions use SECURITY DEFINER to ensure consistent permissions

## Need Help?

If you're still having trouble, please refer to the following resources:
- Supabase Documentation: https://supabase.io/docs
- GitHub Issues: [Link to your repository issues]
