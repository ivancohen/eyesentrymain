# Question Manager Enhancement

This package enhances the Question Manager with category-based cards and reordering functionality. It organizes questions by category and allows for easy reordering within each category.

## Features

1. **Category-Based Organization**:
   - Questions are now organized into cards by category
   - Each category has its own card with a title and description
   - Questions are displayed in a table within each card

2. **Reordering Functionality**:
   - Drag and drop questions to reorder them within a category
   - Use up/down buttons to move questions within a category
   - Automatic display order assignment for new questions

3. **Enhanced Question Service**:
   - Proper implementation of question reordering methods
   - Support for moving questions between categories
   - Automatic display order management

## Implementation Details

### Files Modified

1. **EnhancedQuestionManager.tsx**:
   - Replaced with a new implementation that organizes questions by category
   - Added drag and drop functionality using react-beautiful-dnd
   - Added up/down buttons for reordering questions

2. **QuestionService.ts**:
   - Implemented proper reordering methods
   - Added support for moving questions between categories
   - Added automatic display order management

### Dependencies Added

- **react-beautiful-dnd**: For drag and drop functionality
- **@types/react-beautiful-dnd**: TypeScript types for react-beautiful-dnd

## How to Use

### Installation

Run the update script to install the enhanced Question Manager:

```bash
# For Windows users
update-question-manager.bat

# For Unix/Linux/Mac users
chmod +x update-question-manager.sh
./update-question-manager.sh

# Or directly with Node.js
node update-question-manager.js
```

After running the script, you'll need to:

1. Install the new dependencies (if added):
   ```bash
   npm install
   # or
   yarn
   ```

2. Restart your development server

### Using the Enhanced Question Manager

#### Viewing Questions by Category

Questions are now organized into cards by category. Each card displays:
- The category name
- The number of questions in the category
- A table of questions in that category

#### Reordering Questions

There are two ways to reorder questions within a category:

1. **Drag and Drop**:
   - Click and hold the drag handle (vertical dots) on the left side of a question
   - Drag the question to the desired position
   - Release to drop the question in the new position

2. **Up/Down Buttons**:
   - Click the up arrow button to move a question up in the list
   - Click the down arrow button to move a question down in the list

#### Adding New Questions

When you add a new question, it will automatically be assigned the next available display order in its category.

#### Editing Questions

Click the edit button (pencil icon) to edit a question. The question form will open with the question's current values.

#### Deleting Questions

Click the delete button (trash icon) to delete a question. You will be prompted to confirm the deletion.

## Technical Details

### Category Organization

Questions are grouped by their `page_category` field. The following categories are supported:

- **Patient Information** (`patient_info`)
- **Family & Medication** (`family_medication`)
- **Clinical Measurements** (`clinical_measurements`)

### Display Order Management

Each question has a `display_order` field that determines its position within its category. When reordering questions, the display orders are updated to reflect the new order.

### Drag and Drop Implementation

The drag and drop functionality is implemented using react-beautiful-dnd. Each category has its own droppable area, and each question is a draggable item within that area.

### Question Service Methods

The following methods have been implemented in the QuestionService:

- **moveQuestionUp**: Moves a question up in its category
- **moveQuestionDown**: Moves a question down in its category
- **moveQuestionToCategory**: Moves a question to a different category
- **reorderQuestionsInCategory**: Reorders all questions in a category
- **getNextDisplayOrder**: Gets the next available display order in a category

## Troubleshooting

If you encounter issues after applying the update:

1. **Check Console Logs**: Look for error messages in the browser console.

2. **Verify Dependencies**: Make sure react-beautiful-dnd is installed.

3. **Restore from Backup**: If needed, you can restore the original files from the backups created by the update script:
   - `src/components/admin/EnhancedQuestionManager.tsx.backup-[timestamp]`
   - `src/services/QuestionService.ts.backup-[timestamp]`

4. **Check Database**: Make sure the questions table has the necessary fields:
   - `page_category`: The category of the question
   - `display_order`: The order of the question within its category