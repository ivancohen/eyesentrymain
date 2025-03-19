# AI Assistant Integration

This document outlines the integration of Google's Gemini AI API into the EyeSentry application for enhanced data analysis and question answering capabilities.

## Overview

The AI Assistant feature allows administrators to analyze patient questionnaire data through natural language queries. It uses Google's Gemini LLM API to process these queries and provide insightful responses.

## Configuration

The integration uses the provided Gemini API key:
```
AIzaSyAmQoYJLmVMt310kC2zQ4SlSme6psTgdbQ
```

This key is configured in `src/services/AIAssistantService.ts`.

## Features

1. **Natural Language Query Processing**: Ask questions about patient data in plain English
2. **Data Analysis**: Analyze risk factors, trends, and correlations
3. **Report Generation**: Generate downloadable reports based on analysis
4. **Conversation History**: Save and retrieve past conversations
5. **Contextual Understanding**: The AI uses patient data context for informed responses

## Database Setup

The AI Assistant requires a database table to store conversation history. You need to run the following SQL script to set it up:

```sql
supabase/ai_conversations_setup.sql
```

This script:
- Creates the `ai_conversations` table
- Sets up Row Level Security (RLS) policies
- Ensures proper user permissions
- Creates necessary triggers and functions

## Usage

1. **Access**: Navigate to Admin Panel → AI Assistant
2. **Asking Questions**: Type your query in the chat interface
3. **Viewing Reports**: Generate reports based on AI analysis
4. **Managing History**: Access past conversations from the History tab

## Example Queries

- "What are the most common risk factors across all patients?"
- "Show me the relationship between age and risk level"
- "How have patient risk levels changed over time?"
- "Which demographic has the highest proportion of high-risk patients?"

## Technical Implementation

The AI Assistant integration consists of several components:

### 1. AIAssistantService

Located in `src/services/AIAssistantService.ts`, this service handles:
- API communication with Gemini
- Data preparation and context formation
- Response parsing and formatting
- Conversation management
- Report generation

### 2. AIAssistant Component

Located in `src/components/admin/AIAssistant.tsx`, this React component provides:
- Chat interface
- Report suggestions
- Conversation history management
- Error handling for missing database tables

### 3. Database Schema

The conversation history is stored in the `ai_conversations` table with the following structure:
- `conversation_id` (UUID, PK): Unique identifier
- `user_id` (UUID): Foreign key to auth.users
- `title` (TEXT): Conversation title
- `messages` (JSONB): Array of messages
- `created_at` (TIMESTAMP): Creation timestamp
- `updated_at` (TIMESTAMP): Last update timestamp

## Fallback Mechanism

In case of API failures, the system includes fallback responses to ensure continuity of service. These responses are based on common query patterns and provide a reasonable approximation of what the AI would return.

## Security Considerations

1. **Data Privacy**: The integration anonymizes patient data before processing
2. **Row Level Security**: Ensures users can only access their own conversations
3. **Admin Policies**: Admins have access to all conversations for monitoring purposes
4. **API Key Security**: The API key should be replaced with environment variables in production

## Troubleshooting

### Missing Conversations Table

If you see the error:
```
Error loading conversations: relation "public.ai_conversations" does not exist
```

Run the SQL setup script:
```
supabase/ai_conversations_setup.sql
```

### API Rate Limiting

If you encounter rate limiting issues:
- Implement a throttling mechanism
- Consider upgrading your API quota
- Use the built-in fallback mechanism until rate limits reset

## Future Enhancements

1. **Multi-modal Support**: Incorporate image analysis capabilities
2. **Advanced Filtering**: Add more granular filters for patient data
3. **Interactive Visualizations**: Generate dynamic charts based on analysis
4. **Proactive Insights**: Set up scheduled analysis to proactively identify trends
