-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Step 1: Create the tables
BEGIN;
CREATE TABLE IF NOT EXISTS chatbot_faqs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
COMMIT;

BEGIN;
CREATE TABLE IF NOT EXISTS chatbot_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
COMMIT;

-- Step 2: Create indexes (in separate transactions)
BEGIN;
-- Make sure the table exists before creating the index
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'chatbot_faqs'
  ) THEN
    -- Create the index only if the table exists
    IF EXISTS (
      SELECT FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'chatbot_faqs'
      AND column_name = 'category'
    ) THEN
      EXECUTE 'CREATE INDEX IF NOT EXISTS idx_chatbot_faqs_category ON chatbot_faqs(category)';
    END IF;
  END IF;
END $$;
COMMIT;

BEGIN;
-- Make sure the table exists before creating the index
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'chatbot_history'
  ) THEN
    -- Create the index only if the table exists
    IF EXISTS (
      SELECT FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'chatbot_history'
      AND column_name = 'user_id'
    ) THEN
      EXECUTE 'CREATE INDEX IF NOT EXISTS idx_chatbot_history_user_id ON chatbot_history(user_id)';
    END IF;
  END IF;
END $$;
COMMIT;

-- Step 3: Insert initial FAQ data
BEGIN;
-- Only insert if the table exists and is empty
DO $$
DECLARE
  faq_count INTEGER;
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'chatbot_faqs'
  ) THEN
    SELECT COUNT(*) INTO faq_count FROM chatbot_faqs;
    
    IF faq_count = 0 THEN
      INSERT INTO chatbot_faqs (question, answer, category) VALUES
      (
        'What is the purpose of the questionnaire?',
        'The questionnaire helps identify risk factors for steroid-induced glaucoma. It collects information about your medical history, steroid use, and eye health to help your doctor assess your risk level and provide appropriate recommendations.',
        'Questionnaire'
      ),
      (
        'How is eye pressure measured?',
        'Eye pressure (intraocular pressure or IOP) is typically measured using a tonometer. The most common method is Goldmann applanation tonometry, which involves gently touching the front surface of your eye with a small probe after applying numbing eye drops. Normal eye pressure ranges from 10-21 mmHg.',
        'Eye Pressure'
      ),
      (
        'What are the different types of steroids that can affect eye pressure?',
        'Several types of steroids can affect eye pressure: 1) Topical steroids (eye drops, creams), 2) Inhaled steroids (for asthma/COPD), 3) Oral steroids (pills), 4) Injectable steroids (shots), and 5) Intravitreal steroids (injected directly into the eye). The risk varies based on the type, potency, dose, and duration of use.',
        'Steroids'
      ),
      (
        'What equipment is used to measure eye pressure?',
        'Several devices can measure eye pressure: 1) Goldmann applanation tonometer (the gold standard), 2) Non-contact tonometer (air puff test), 3) iCare tonometer (rebound tonometry), 4) Tono-Pen (handheld applanation), and 5) Ocular Response Analyzer. Your doctor will select the most appropriate method based on your specific situation.',
        'Equipment'
      ),
      (
        'What is steroid-induced glaucoma?',
        'Steroid-induced glaucoma is a form of open-angle glaucoma that occurs as a side effect of steroid use. Steroids can cause increased eye pressure in some individuals, which can damage the optic nerve if not monitored and treated. Risk factors include family history of glaucoma, high myopia (nearsightedness), diabetes, and previous steroid response.',
        'Diagnosis'
      );
    END IF;
  END IF;
END $$;
COMMIT;

-- Step 4: Set up RLS policies
BEGIN;
-- Enable RLS on tables
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'chatbot_faqs'
  ) THEN
    EXECUTE 'ALTER TABLE chatbot_faqs ENABLE ROW LEVEL SECURITY';
    
    -- Drop existing policies if they exist
    EXECUTE 'DROP POLICY IF EXISTS "Allow public read access to FAQs" ON chatbot_faqs';
    
    -- Create basic policies
    EXECUTE 'CREATE POLICY "Allow public read access to FAQs" 
      ON chatbot_faqs FOR SELECT 
      USING (true)';
  END IF;
  
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'chatbot_history'
  ) THEN
    EXECUTE 'ALTER TABLE chatbot_history ENABLE ROW LEVEL SECURITY';
    
    -- Drop existing policies if they exist
    EXECUTE 'DROP POLICY IF EXISTS "Allow users to view their own chat history" ON chatbot_history';
    EXECUTE 'DROP POLICY IF EXISTS "Allow users to insert their own chat history" ON chatbot_history';
    
    -- Create basic policies
    EXECUTE 'CREATE POLICY "Allow users to view their own chat history" 
      ON chatbot_history FOR SELECT 
      USING (auth.uid() = user_id)';
    
    EXECUTE 'CREATE POLICY "Allow users to insert their own chat history" 
      ON chatbot_history FOR INSERT 
      WITH CHECK (auth.uid() = user_id)';
  END IF;
END $$;
COMMIT;

-- Step 5: Create admin policies
BEGIN;
-- Check if user_roles table exists
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'chatbot_faqs'
  ) THEN
    IF EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'user_roles'
    ) THEN
      -- Create admin policies if user_roles table exists
      EXECUTE 'DROP POLICY IF EXISTS "Allow admin full access to FAQs" ON chatbot_faqs';
      EXECUTE 'CREATE POLICY "Allow admin full access to FAQs" 
        ON chatbot_faqs FOR ALL 
        USING (auth.uid() IN (
          SELECT user_id FROM user_roles WHERE role = ''admin''
        ))';
      
      IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'chatbot_history'
      ) THEN
        EXECUTE 'DROP POLICY IF EXISTS "Allow admins full access to chat history" ON chatbot_history';
        EXECUTE 'CREATE POLICY "Allow admins full access to chat history" 
          ON chatbot_history FOR ALL 
          USING (auth.uid() IN (
            SELECT user_id FROM user_roles WHERE role = ''admin''
          ))';
      END IF;
    ELSE
      -- Create fallback policies if user_roles table doesn't exist
      EXECUTE 'DROP POLICY IF EXISTS "Allow admin full access to FAQs fallback" ON chatbot_faqs';
      EXECUTE 'CREATE POLICY "Allow admin full access to FAQs fallback" 
        ON chatbot_faqs FOR ALL 
        USING (auth.uid() IN (
          SELECT id FROM auth.users WHERE email LIKE ''%@admin.com''
        ))';
      
      IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'chatbot_history'
      ) THEN
        EXECUTE 'DROP POLICY IF EXISTS "Allow admins full access to chat history fallback" ON chatbot_history';
        EXECUTE 'CREATE POLICY "Allow admins full access to chat history fallback" 
          ON chatbot_history FOR ALL 
          USING (auth.uid() IN (
            SELECT id FROM auth.users WHERE email LIKE ''%@admin.com''
          ))';
      END IF;
    END IF;
  END IF;
END $$;
COMMIT;