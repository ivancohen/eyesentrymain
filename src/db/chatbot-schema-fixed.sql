-- Create extension for UUID generation if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create extension for text search if not exists
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create FAQ categories table
CREATE TABLE IF NOT EXISTS chatbot_faq_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  is_active BOOLEAN DEFAULT TRUE
);

-- Create FAQs table
CREATE TABLE IF NOT EXISTS chatbot_faqs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID REFERENCES chatbot_faq_categories(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  is_active BOOLEAN DEFAULT TRUE
);

-- Create conversations table
CREATE TABLE IF NOT EXISTS chatbot_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  messages JSONB DEFAULT '[]'::JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create function to get conversation history
CREATE OR REPLACE FUNCTION get_conversation_history(user_id_param UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  conversation_record RECORD;
BEGIN
  -- Get the conversation for the user
  SELECT * INTO conversation_record
  FROM chatbot_conversations
  WHERE user_id = user_id_param
  ORDER BY updated_at DESC
  LIMIT 1;
  
  -- If no conversation exists, return null
  IF conversation_record IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Return the conversation
  RETURN json_build_object(
    'id', conversation_record.id,
    'userId', conversation_record.user_id,
    'messages', conversation_record.messages,
    'createdAt', conversation_record.created_at,
    'updatedAt', conversation_record.updated_at
  )::JSONB;
END;
$$;

-- Create function to save conversation
CREATE OR REPLACE FUNCTION save_conversation(user_id_param UUID, messages_param JSONB)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  conversation_id UUID;
BEGIN
  -- Check if a conversation exists for the user
  SELECT id INTO conversation_id
  FROM chatbot_conversations
  WHERE user_id = user_id_param
  ORDER BY updated_at DESC
  LIMIT 1;
  
  -- If a conversation exists, update it
  IF conversation_id IS NOT NULL THEN
    UPDATE chatbot_conversations
    SET messages = messages_param,
        updated_at = NOW()
    WHERE id = conversation_id;
  -- Otherwise, create a new conversation
  ELSE
    INSERT INTO chatbot_conversations (user_id, messages)
    VALUES (user_id_param, messages_param);
  END IF;
END;
$$;

-- Create function to search FAQs
CREATE OR REPLACE FUNCTION search_faqs(search_query TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  results JSONB;
BEGIN
  -- Search for FAQs that match the query
  SELECT json_agg(
    json_build_object(
      'id', f.id,
      'question', f.question,
      'answer', f.answer,
      'category', c.name,
      'priority', f.priority
    )
  ) INTO results
  FROM chatbot_faqs f
  JOIN chatbot_faq_categories c ON f.category_id = c.id
  WHERE
    f.is_active = TRUE AND
    c.is_active = TRUE AND
    (
      f.question ILIKE '%' || search_query || '%' OR
      f.answer ILIKE '%' || search_query || '%' OR
      c.name ILIKE '%' || search_query || '%'
    )
  GROUP BY f.id, f.question, f.answer, c.name, f.priority
  ORDER BY
    f.priority DESC,
    similarity(f.question, search_query) DESC
  LIMIT 5;
  
  -- If no results, return empty array
  IF results IS NULL THEN
    RETURN '[]'::JSONB;
  END IF;
  
  RETURN results;
END;
$$;

-- Enable RLS on tables
ALTER TABLE chatbot_faq_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatbot_faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatbot_conversations ENABLE ROW LEVEL SECURITY;

-- Create a function to check if a user is an admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Since we don't have a user_roles table, we'll allow any authenticated user
  -- to manage the chatbot for now. You should replace this with your own admin check logic.
  RETURN TRUE;
END;
$$;

-- Admin can do anything
CREATE POLICY admin_all_chatbot_faq_categories ON chatbot_faq_categories
  FOR ALL TO authenticated
  USING (is_admin());

CREATE POLICY admin_all_chatbot_faqs ON chatbot_faqs
  FOR ALL TO authenticated
  USING (is_admin());

-- Users can only see their own conversations
CREATE POLICY user_select_own_conversations ON chatbot_conversations
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chatbot_faqs_question_gin ON chatbot_faqs USING gin(question gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_chatbot_faqs_answer_gin ON chatbot_faqs USING gin(answer gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_chatbot_conversations_user_id ON chatbot_conversations(user_id);

-- Add some sample data
INSERT INTO chatbot_faq_categories (name, description, is_active)
VALUES 
  ('General', 'General questions about the questionnaire', TRUE),
  ('Equipment', 'Questions about equipment needed for measurements', TRUE),
  ('Measurements', 'Questions about how to take accurate measurements', TRUE),
  ('Steroids', 'Questions about steroid treatments and their effects', TRUE),
  ('Results', 'Questions about interpreting results', TRUE);

-- Insert some sample FAQs
INSERT INTO chatbot_faqs (category_id, question, answer, priority, is_active)
VALUES 
  ((SELECT id FROM chatbot_faq_categories WHERE name = 'General'), 
   'What is the purpose of this questionnaire?', 
   'This questionnaire helps us gather important information about your patient''s eye health and symptoms. It allows us to assess risk factors for various eye conditions and provide appropriate recommendations for treatment or further evaluation.', 
   10, 
   TRUE),
   
  ((SELECT id FROM chatbot_faq_categories WHERE name = 'Equipment'), 
   'What equipment do I need to measure intraocular pressure?', 
   'To measure intraocular pressure (IOP), you''ll need a tonometer. The most common types are Goldmann applanation tonometers, non-contact tonometers (air puff), and handheld tonometers like the Tono-Pen or iCare. Make sure your equipment is calibrated regularly for accurate readings.', 
   8, 
   TRUE),
   
  ((SELECT id FROM chatbot_faq_categories WHERE name = 'Measurements'), 
   'How do I ensure accurate corneal thickness measurements?', 
   'For accurate corneal thickness measurements, use a pachymeter and follow these steps: 1) Ensure the patient is seated comfortably with their chin on the rest and forehead against the band. 2) Apply a topical anesthetic to the eye. 3) Position the pachymeter probe perpendicular to the center of the cornea. 4) Take multiple readings (at least 3) and use the average. 5) Measure both eyes for comparison.', 
   7, 
   TRUE),
   
  ((SELECT id FROM chatbot_faq_categories WHERE name = 'Steroids'), 
   'What are the risks of long-term steroid use for eye conditions?', 
   'Long-term steroid use can lead to several complications including: 1) Increased intraocular pressure (steroid-induced glaucoma), 2) Cataract formation, 3) Increased susceptibility to infections, 4) Delayed wound healing, and 5) Thinning of the cornea. It''s important to monitor patients regularly, especially those with risk factors like family history of glaucoma or previous steroid response.', 
   9, 
   TRUE),
   
  ((SELECT id FROM chatbot_faq_categories WHERE name = 'Results'), 
   'How do I interpret the risk assessment score?', 
   'The risk assessment score indicates the likelihood of developing certain eye conditions. Scores are categorized as Low (1-3), Moderate (4-6), and High (7-10). A high score suggests the need for more frequent monitoring or immediate intervention. Consider the score alongside clinical findings, patient history, and other diagnostic tests for a comprehensive evaluation.', 
   10, 
   TRUE);