# Question Management Guide

## Overview

This guide provides instructions for managing questions in the EyeSentry system, including adding, editing, and categorizing questions by page.

## Current Capabilities

The system now supports:

1. **Fixed Question Display**: The error "column questions.question_text does not exist" has been fixed.
2. **Question Management**: View, edit and delete existing questions.
3. **Question Scoring**: Manage scores for questions and their options.

## New Features Added

We've enhanced the system with:

1. **Page Categories**: Questions can now be assigned to specific pages in the questionnaire.
2. **Visual Organization**: Questions are displayed with their page category in the question list.
3. **Improved Question Management**: New questions can be added with proper page assignment.
4. **Integrated Scoring Management**: Question scores can be edited directly in the admin panel.
5. **Real Questionnaire Questions**: The system now imports and manages the actual questionnaire questions.

## Important Notes

1. **Database Update Required**: The `page_category` column needs to be added to the database by running:
   ```
   supabase/add_question_category.sql
   ```
   Until this is done, the page category feature will be ready in the frontend but not fully functional.

2. **Importing Questionnaire Questions**: To import the current questionnaire questions into the management system:
   ```
   npx tsx src/utils/import-questionnaire-questions.js
   ```
   This will:
   - Import all questions from the questionnaire
   - Assign appropriate page categories
   - Set initial scores for dropdown options
   - Delete any existing sample questions

## How to Add New Questions

1. Navigate to the **Admin** section (requires admin access)
2. Go to the **Question Management** tab
3. Click the **Add Question** button
4. Fill in the form:
   - Question text
   - Question type (dropdown, text, etc.)
   - Page/Category (which page this should appear on)
5. For dropdown questions:
   - After saving the question, you'll be taken to the dropdown options manager
   - Add options (Yes/No, etc.) and their scores
   - Click Save when done

## How to Edit Existing Questions

1. In the **Admin** section's **Question Management** tab
2. Find the question in the list
3. Click the Edit button (pencil icon)
4. Update the question details, including its page category
5. Click Save

## How to Manage Question Scores

1. Navigate to the **Admin** page
2. Go to the **Question Scoring** section
3. Find the question in the list
4. Click the Edit button to adjust scores

## Page Categories

Questions can be assigned to the following pages:

1. **Patient Information** (`patient_info`)
   - Basic patient details
   - Contact information
   - Demographics

2. **Family & Medication History** (`family_medication`)
   - Family eye disease history
   - Current medications
   - Steroid usage

3. **Clinical Measurements** (`clinical_measurements`)
   - IOP measurements
   - Visual field test results
   - OCT imaging data

## Technical Implementation Details

- `page_category` field has been added to the Question interface
- Question form has been updated to include page selection
- Table display shows the page/category for each question
- Backend prepared for database schema update
