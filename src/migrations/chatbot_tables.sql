-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create table for chatbot FAQs
CREATE TABLE IF NOT EXISTS chatbot_faqs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create table for chat history
CREATE TABLE IF NOT EXISTS chatbot_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on tables
ALTER TABLE chatbot_faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatbot_history ENABLE ROW LEVEL SECURITY;

-- Create basic policies
CREATE POLICY "Allow public read access to FAQs" 
  ON chatbot_faqs FOR SELECT 
  USING (true);

CREATE POLICY "Allow users to view their own chat history" 
  ON chatbot_history FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Allow users to insert their own chat history" 
  ON chatbot_history FOR INSERT 
  WITH CHECK (auth.uid() = user_id);