# AI Data Explorer Integration Guide

This guide explains how to set up and use the new AI-powered Data Explorer feature that has been added to the EyeSentry application.

## Overview

The AI Data Explorer allows users to:

1. Ask questions about patient data in natural language
2. Get AI-generated SQL queries for complex data analysis
3. Visualize results with appropriate chart types
4. Use voice input for hands-free operation

## Prerequisites

Before using the AI Data Explorer, ensure you have:

1. Set up the EyeSentry database with required tables
2. Installed all front-end dependencies 
3. Enabled the AI Assistant service with a valid Gemini API key

## Database Setup

1. Run the SQL script to create the secure query execution function:

```bash
psql -U your_username -d your_database -f supabase/ai_data_explorer_setup.sql
```

Or execute the SQL directly through the Supabase dashboard.

This will:
- Create the `execute_safe_query` function that allows only safe SELECT queries
- Set up security measures to prevent SQL injection or data modification
- Grant appropriate permissions to authenticated users

## How It Works

### 1. Natural Language to SQL Conversion

The system uses Google's Gemini AI to:
- Interpret natural language questions about patient data
- Generate appropriate PostgreSQL queries
- Structure the data for visualization

### 2. Security Measures

To ensure data safety, the system:
- Only allows SELECT queries (no data modification)
- Prevents multiple statement execution
- Scans for dangerous keywords
- Limits result sets to prevent memory issues
- Uses parameterized execution to prevent injection

### 3. Voice Input Support

Voice input allows:
- Hands-free operation in clinical settings
- Dictating complex questions naturally
- Automatically detecting the active input field

## Using the Data Explorer

1. Navigate to the AI Assistant tab in the Admin panel
2. Click on the "Data Explorer" tab
3. Ask a question about your patient data in natural language
   - Example: "Show me patients with high risk levels by age group"
   - Example: "What percentage of patients report family history of glaucoma?"
4. The system will:
   - Generate an appropriate SQL query
   - Execute it securely
   - Visualize the results with an appropriate chart type
   - Provide a natural language explanation

### Using Voice Input

1. Click the microphone icon next to the input field
2. Speak your question clearly
3. The transcribed text will appear in the input field
4. Click Send or press Enter to submit

## Example Questions

Here are some example questions you can ask:

```
How many patients are in each risk level category?
Show the trend of questionnaire submissions over the last 6 months
What percentage of patients report a family history of glaucoma by age group?
Which risk factors appear most frequently together?
Show me patients with high IOP readings grouped by age
What's the relationship between ocular steroid use and risk level?
```

## Troubleshooting

### Common Issues

1. **SQL Function Missing Error**
   - Run the ai_data_explorer_setup.sql script

2. **Voice Recognition Not Working**
   - Ensure you're using a compatible browser (Chrome recommended)
   - Check that your microphone is enabled and working
   - Try refreshing the page

3. **Charts Not Displaying Correctly**
   - Try reformulating your question to be more specific
   - Include the type of visualization you want in your query
     (e.g., "Show me a bar chart of risk levels by age group")

## Technical Details

### Components Used

1. **Frontend**
   - React with TypeScript
   - recharts for data visualization
   - Web Speech API for voice recognition

2. **Backend**
   - Supabase PostgreSQL for data storage
   - Custom SQL function for secure query execution
   - Gemini API for natural language understanding

### Security Considerations

The SQL generation system has multiple layers of protection:

1. **Query Validation**
   - Only SELECT statements are allowed
   - No multiple statements
   - Keyword filtering for potentially dangerous operations

2. **Execution Environment**
   - Queries run with limited permissions
   - Row-level security applies to all queries
   - Result sets are limited to prevent DOS attacks

3. **Data Protection**
   - Patient identifiable information is not included in results
   - All queries respect existing RLS policies
   - All requests are logged for audit purposes

## Extending the System

Developers can extend the AI Data Explorer by:

1. Adding new visualization types in AIAssistant.tsx
2. Enhancing the schema information in AIAssistantService.ts
3. Creating additional example queries for common use cases

For more information, contact the development team.
