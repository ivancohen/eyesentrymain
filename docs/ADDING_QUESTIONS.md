# Adding Questions to the Questionnaire

## Overview

The application has two separate areas for question management:

1. **Questions Page** - For creating, editing, and managing questions
2. **Question Scoring** (in Admin) - For managing scores for existing questions

To add a new question to the questionnaire, you need to first create it through the Questions page, then you can manage its scoring through the Question Scoring section.

## Step-by-Step Guide

### Step 1: Create a New Question

1. Navigate to the **Questions** page from the main navigation menu
2. Click the **Add Question** button to display the question form
3. Fill in the question details:
   - Question text
   - Question type (dropdown, checkbox, radio, etc.)
   - Other relevant settings
4. Save the question

### Step 2: Configure Question Options (if needed)

Depending on the question type, you may need to configure:
- Dropdown options
- Conditional items
- Scoring

This is done on the same Questions page by editing the question after it's created.

### Step 3: Manage Question Scoring

Once your question is created:

1. Navigate to the **Admin** page
2. Go to the **Question Scoring** section
3. Find your newly created question
4. Click the edit (pencil) icon to adjust scores for each option

## Important Notes

- The Question Manager in the Admin section only manages scores for existing questions
- New questions must be created through the Questions page
- After creating a question, you must navigate to the Question Scoring section to set up its scoring

## Troubleshooting

If your new question doesn't appear in the Question Scoring section:
1. Make sure you've saved the question successfully on the Questions page
2. Check that you've configured dropdown options if it's a dropdown question
3. Try refreshing the Question Scoring table using the refresh button
4. Verify that the question has the correct settings for scoring (has_dropdown_scoring set to true)
