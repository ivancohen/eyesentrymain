-- AI ASSISTANT SETUP
-- Create tables and functions for the AI assistant feature

-- 1. Create ai_conversations table to store chat history
CREATE TABLE IF NOT EXISTS ai_conversations (
  conversation_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  title TEXT NOT NULL,
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;

-- Policy: users can only see their own conversations
CREATE POLICY "Users can view their own conversations" 
  ON ai_conversations 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Policy: users can insert their own conversations
CREATE POLICY "Users can create their own conversations" 
  ON ai_conversations 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Policy: users can update their own conversations
CREATE POLICY "Users can update their own conversations" 
  ON ai_conversations 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Policy: users can delete their own conversations
CREATE POLICY "Users can delete their own conversations" 
  ON ai_conversations 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- 2. Create ai_reports table to store generated reports
CREATE TABLE IF NOT EXISTS ai_reports (
  report_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES ai_conversations,
  user_id UUID REFERENCES auth.users NOT NULL,
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  content JSONB NOT NULL,
  file_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE ai_reports ENABLE ROW LEVEL SECURITY;

-- Policy: users can only see their own reports
CREATE POLICY "Users can view their own reports" 
  ON ai_reports 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Policy: users can insert their own reports
CREATE POLICY "Users can create their own reports" 
  ON ai_reports 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Policy: users can delete their own reports
CREATE POLICY "Users can delete their own reports" 
  ON ai_reports 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- 3. Create a view for anonymized patient data that will be used by the AI
CREATE OR REPLACE VIEW ai_patient_data AS
SELECT 
  pr.id,
  pr.created_at,
  EXTRACT(YEAR FROM pr.created_at) AS year,
  EXTRACT(MONTH FROM pr.created_at) AS month,
  pr.response,
  pr.risk_level,
  pr.total_score
FROM 
  patient_responses pr;

-- Grant access to the views
GRANT SELECT ON ai_patient_data TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ai_conversations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ai_reports TO authenticated;
