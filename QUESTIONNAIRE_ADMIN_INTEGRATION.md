# Questionnaire Admin Integration Plan

## Problem Statement

The current questionnaire system has a critical issue: it's using hardcoded question types, options, and risk scores instead of fetching them from the admin panel. This creates inconsistency between what administrators configure and what users see in the questionnaire.

Specifically:
- Patient first name and last name fields are being rendered as dropdown options when they should respect the question_type set in the admin dashboard
- Question options are hardcoded in the frontend instead of being fetched from the database
- Risk scores are not being properly applied from the admin-defined values

## Root Cause Analysis

1. The `QuestionnaireForm` component is overriding the question types from the database with hardcoded values
2. The SQL update script is forcing name fields to be select/dropdown type instead of respecting admin settings
3. The component is not properly rendering different field types based on the question_type from the database

## Solution Approach

### 1. Database Changes

- Remove hardcoded setting of question_type for first name and last name fields in the SQL script
- Keep the has_dropdown_options flag update for questions that have options in the dropdown_options table
- Fix SQL syntax errors in the update statements

### 2. Frontend Changes

- Update the QuestionnaireForm component to render fields based on their question_type from the database
- Add conditional rendering in the component to handle different question types (text, select, etc.)
- Ensure the form respects the question_type set in the admin dashboard
- Implement proper handling of dropdown options from the database

### 3. Integration with Admin Panel

- Ensure that changes made in the admin panel are immediately reflected in the questionnaire
- Add logging to track where question types and options are coming from
- Implement fallback options only when database options aren't available

## Implementation Steps

1. Update the SQL script to remove hardcoded question types for name fields
2. Modify the QuestionnaireForm component to render different field types based on question_type
3. Update the PatientQuestionnaireService to properly fetch and use question types from the database
4. Add conditional rendering in the component for text inputs, select dropdowns, etc.
5. Test the changes to ensure all fields are rendered according to their admin-defined types

## Expected Outcome

After implementing these changes:
- All question fields will be rendered according to their type as defined in the admin dashboard
- Patient first name and last name fields will respect their admin-defined types (text or select)
- Question options will be fetched from the database instead of being hardcoded
- Risk scores will be properly applied from the admin-defined values

## Recommendation

To implement these changes, we should switch to Code mode to make the necessary code modifications.