# Dropdown Options Reordering Fix

## Overview

This document explains the changes made to fix the dropdown options reordering functionality while maintaining all other features including scoring and risk assessment.

## Problem

The application had inconsistencies in how dropdown options were stored and retrieved:

1. **Multiple Tables**: The code was trying to use both `question_options` and `dropdown_options` tables
2. **Missing Display Order**: The `display_order` field was commented out in some parts of the code
3. **RLS Policy Issues**: Row-Level Security policies were inconsistent, causing access problems
4. **Code Inconsistencies**: Different components had different expectations about the data structure

## Solution

We've implemented a comprehensive solution that:

1. **Standardizes on a Single Table**: All dropdown options are now stored in the `dropdown_options` table
2. **Adds Display Order Support**: The `display_order` field is now properly used throughout the application
3. **Implements Consistent RLS Policies**: All tables have appropriate security policies
4. **Provides Secure Database Functions**: Added security definer functions for database operations

## Changes Made

### Database Changes

1. **Table Structure**:
   - Added `display_order` column to `dropdown_options` table (if not already present)
   - Migrated any data from `question_options` to `dropdown_options`
   - Assigned sequential display orders to existing options

2. **Security Policies**:
   - Implemented consistent RLS policies for `dropdown_options`
   - Created security definer functions for secure access

3. **Stored Procedures**:
   - `get_dropdown_options_for_question`: Retrieves options with proper ordering
   - `update_dropdown_option_order`: Updates option order with proper reordering logic
   - `create_dropdown_option`: Creates new options with automatic ordering

### Code Changes

1. **PatientQuestionnaireService.ts**:
   - Updated interfaces to include `display_order` property
   - Modified `getQuestionsWithTooltips()` to use only `dropdown_options` table
   - Added proper ordering by `display_order`

2. **QuestionnaireForm.tsx**:
   - Updated type guards to include `display_order` property
   - Added sorting by `display_order` when rendering options
   - Ensured consistent handling of options across the component

3. **Constants**:
   - Added `order` property to `QuestionOption` interface for hardcoded options

## How to Maintain

When working with dropdown options:

1. **Always use the `dropdown_options` table** - Do not create or use other tables for this purpose
2. **Include `display_order` in queries** - Always order by `display_order` when fetching options
3. **Use the provided functions** - Use the security definer functions for database operations
4. **Keep interfaces consistent** - Ensure all interfaces include the `display_order` property

## Database Schema

```
questions
├── id (PK)
├── question
├── tooltip
├── page_category
├── question_type
├── display_order
├── conditional_parent_id (FK)
└── conditional_required_value

dropdown_options
├── id (PK)
├── question_id (FK)
├── option_value
├── option_text
├── score
└── display_order
```

## Testing

After applying these changes:

1. Verify that dropdown options appear in the correct order
2. Confirm that scoring and risk assessment still work correctly
3. Test that conditional questions function properly
4. Ensure that RLS policies allow appropriate access

## Future Considerations

If you need to add new features related to dropdown options:

1. Always include `display_order` in any new code
2. Use the `dropdown_options` table exclusively
3. Maintain consistent RLS policies
4. Update all interfaces and type guards as needed