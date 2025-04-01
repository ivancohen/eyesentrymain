# Chatbot Implementation for Doctor Knowledge Base

## Overview

The Eye Sentry Chatbot provides doctors with a knowledge base to answer questions about the questionnaire, eye pressure measurements, steroids, equipment, diagnosis, and treatment recommendations. The chatbot consists of two main components:

1. **Doctor-facing Chatbot Interface**: Embedded in the Doctor dashboard, allowing doctors to ask questions and get immediate answers.
2. **Admin Knowledge Base Management**: Allows administrators to manage the FAQ content that powers the chatbot.

## Features

### Doctor Chatbot Interface

- **FAQ Browser**: Doctors can browse through categorized frequently asked questions.
- **Interactive Chat**: Doctors can ask specific questions and receive contextual answers.
- **Category Filtering**: Questions can be filtered by categories like Questionnaire, Eye Pressure, Steroids, etc.
- **Search Functionality**: Doctors can search for specific topics across all FAQs.
- **Chat History**: Previous conversations are saved for future reference.

### Admin Knowledge Base Management

- **FAQ Management**: Admins can add, edit, and delete FAQ entries.
- **Category Organization**: FAQs can be organized by categories for better structure.
- **Content Editing**: Rich text editor for creating comprehensive answers.
- **Search and Filter**: Tools to easily find and manage existing content.

## Technical Implementation

### Database Schema

The chatbot functionality is powered by two main tables:

1. **chatbot_faqs**: Stores the knowledge base content
   - `id`: UUID primary key
   - `question`: The question text
   - `answer`: The detailed answer
   - `category`: Category classification (Questionnaire, Eye Pressure, Steroids, etc.)
   - `created_at`: Timestamp of creation
   - `updated_at`: Timestamp of last update

2. **chatbot_history**: Stores user chat interactions
   - `id`: UUID primary key
   - `user_id`: Reference to the user who asked the question
   - `role`: Either 'user' or 'assistant'
   - `content`: The message content
   - `created_at`: Timestamp of the message

### Components

1. **ChatbotFAQ.tsx**: The main component displayed on the Doctor dashboard
   - Provides tabbed interface between FAQ browsing and chat
   - Handles message history and user interactions
   - Implements search and filtering functionality

2. **ChatbotFAQAdmin.tsx**: Admin interface for managing the knowledge base
   - CRUD operations for FAQ entries
   - Category management
   - Search and filtering tools

### Integration with LLM (Future Enhancement)

The current implementation uses a simple keyword matching approach to find relevant answers. In the future, this can be enhanced by integrating with an LLM API like OpenAI's GPT or Google's Gemini:

1. **Context Building**: The system would fetch relevant FAQs based on the user's question
2. **Prompt Construction**: Create a prompt that includes the question and relevant context
3. **LLM Query**: Send the prompt to the LLM API
4. **Response Processing**: Process and display the LLM's response

## Setup Instructions

### Database Setup

1. Run the SQL migration script to create the necessary tables:
   ```
   node execute-chatbot-schema-direct.js
   ```

2. This will create the required tables and populate them with initial FAQ data.

### Admin Access

1. Navigate to the admin dashboard at `/new-admin`
2. Click on "Chatbot Knowledge Base" card
3. Use the interface to manage FAQ content

## Usage Guidelines

### For Doctors

- Use the chatbot to quickly find answers about the questionnaire and related topics
- Browse FAQs by category or use the search function
- Ask specific questions in the chat interface
- Reference previous conversations in the chat history

### For Administrators

- Regularly update the FAQ content to address common questions
- Organize content into appropriate categories
- Provide comprehensive answers with relevant medical information
- Monitor chat history to identify common questions that should be added to the FAQ

## Security Considerations

- Row-level security policies ensure that:
  - FAQs are publicly readable but only modifiable by admins
  - Chat history is only accessible to the user who created it and admins
- All database operations are performed through the Supabase client with appropriate authentication

## Future Enhancements

1. **LLM Integration**: Connect to OpenAI or Gemini for more sophisticated responses
2. **Analytics Dashboard**: Track common questions and usage patterns
3. **Content Versioning**: Keep track of changes to FAQ content
4. **Multimedia Support**: Add images and videos to enhance explanations
5. **Export/Import**: Tools to backup and restore the knowledge base