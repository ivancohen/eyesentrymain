# Database Schema Standards

## Column Naming Conventions

### Question Fields

The standard field name for storing question text is `question`.

Do not use alternative field names such as:
- ❌ `question_text`
- ❌ `questionText`
- ❌ `text`

Example of correct usage in database schema:
```sql
CREATE TABLE questions (
  id UUID PRIMARY KEY,
  question TEXT NOT NULL,
  question_type TEXT,
  ...
);
```

Example of correct usage in TypeScript:
```typescript
interface Question {
  id: string;
  question: string;
  question_type?: string;
  ...
}
```

## Background

Historically, there was inconsistency in the codebase between `question` and `question_text` fields. In March 2025, this was standardized to use only `question` to avoid confusion and errors.

The standardization included:
1. Updating all code references to use `question` consistently
2. Migrating any `question_text` data to `question`
3. Removing the redundant `question_text` column from the database
4. Adding database comments to document the standardization

## Adding New Tables or Fields

When adding new tables or fields related to questions:
- Always use `question` for the main question text field
- Add a descriptive database comment to reinforce the standard
- Follow the same pattern for other text fields (avoid adding redundant `_text` suffixes)
