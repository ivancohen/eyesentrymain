import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Initialize environment variables
dotenv.config();

// Get current file directory (ESM equivalent of __dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Supabase URL or service role key is missing.');
  console.error('Make sure SUPABASE_URL and SUPABASE_SERVICE_KEY are set in your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function executeChatbotSchema() {
  try {
    console.log('Starting chatbot schema creation...');
    
    // Step 1: Create chatbot_faqs table
    console.log('Creating chatbot_faqs table...');
    const { error: faqsTableError } = await supabase.from('chatbot_faqs').select('id').limit(1).maybeSingle();
    
    if (faqsTableError && faqsTableError.code === '42P01') { // Table doesn't exist
      console.log('Table chatbot_faqs does not exist, creating it...');
      
      // First create the table without any indexes
      const createFaqsTableResponse = await fetch(`${supabaseUrl}/rest/v1/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          query: `
            CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
            
            CREATE TABLE IF NOT EXISTS chatbot_faqs (
              id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
              question TEXT NOT NULL,
              answer TEXT NOT NULL,
              category TEXT NOT NULL,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
          `
        })
      });
      
      if (!createFaqsTableResponse.ok) {
        const errorText = await createFaqsTableResponse.text();
        console.error('Error creating chatbot_faqs table:', errorText);
      } else {
        console.log('Successfully created chatbot_faqs table');
        
        // Now create the index in a separate operation
        console.log('Creating index on category column...');
        const createIndexResponse = await fetch(`${supabaseUrl}/rest/v1/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'apikey': supabaseServiceKey,
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({
            query: `CREATE INDEX IF NOT EXISTS idx_chatbot_faqs_category ON chatbot_faqs(category);`
          })
        });
        
        if (!createIndexResponse.ok) {
          const errorText = await createIndexResponse.text();
          console.error('Error creating index on category column:', errorText);
        } else {
          console.log('Successfully created index on category column');
        }
      }
    } else if (faqsTableError) {
      console.error('Error checking chatbot_faqs table:', faqsTableError);
    } else {
      console.log('Table chatbot_faqs already exists');
    }
    
    // Step 2: Create chatbot_history table
    console.log('Creating chatbot_history table...');
    const { error: historyTableError } = await supabase.from('chatbot_history').select('id').limit(1).maybeSingle();
    
    if (historyTableError && historyTableError.code === '42P01') { // Table doesn't exist
      console.log('Table chatbot_history does not exist, creating it...');
      
      // First create the table without any indexes
      const createHistoryTableResponse = await fetch(`${supabaseUrl}/rest/v1/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          query: `
            CREATE TABLE IF NOT EXISTS chatbot_history (
              id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
              user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
              role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
              content TEXT NOT NULL,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
          `
        })
      });
      
      if (!createHistoryTableResponse.ok) {
        const errorText = await createHistoryTableResponse.text();
        console.error('Error creating chatbot_history table:', errorText);
      } else {
        console.log('Successfully created chatbot_history table');
        
        // Now create the index in a separate operation
        console.log('Creating index on user_id column...');
        const createIndexResponse = await fetch(`${supabaseUrl}/rest/v1/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'apikey': supabaseServiceKey,
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({
            query: `CREATE INDEX IF NOT EXISTS idx_chatbot_history_user_id ON chatbot_history(user_id);`
          })
        });
        
        if (!createIndexResponse.ok) {
          const errorText = await createIndexResponse.text();
          console.error('Error creating index on user_id column:', errorText);
        } else {
          console.log('Successfully created index on user_id column');
        }
      }
    } else if (historyTableError) {
      console.error('Error checking chatbot_history table:', historyTableError);
    } else {
      console.log('Table chatbot_history already exists');
    }
    
    // Step 3: Insert initial FAQ data
    console.log('Checking for existing FAQ data...');
    const { data: existingFaqs, error: countError } = await supabase
      .from('chatbot_faqs')
      .select('id', { count: 'exact' });
    
    if (countError) {
      console.error('Error checking existing FAQs:', countError);
    } else if (!existingFaqs || existingFaqs.length === 0) {
      console.log('No existing FAQs found, inserting initial data...');
      
      const initialFaqs = [
        {
          question: 'What is the purpose of the questionnaire?',
          answer: 'The questionnaire helps identify risk factors for steroid-induced glaucoma. It collects information about your medical history, steroid use, and eye health to help your doctor assess your risk level and provide appropriate recommendations.',
          category: 'Questionnaire'
        },
        {
          question: 'How is eye pressure measured?',
          answer: 'Eye pressure (intraocular pressure or IOP) is typically measured using a tonometer. The most common method is Goldmann applanation tonometry, which involves gently touching the front surface of your eye with a small probe after applying numbing eye drops. Normal eye pressure ranges from 10-21 mmHg.',
          category: 'Eye Pressure'
        },
        {
          question: 'What are the different types of steroids that can affect eye pressure?',
          answer: 'Several types of steroids can affect eye pressure: 1) Topical steroids (eye drops, creams), 2) Inhaled steroids (for asthma/COPD), 3) Oral steroids (pills), 4) Injectable steroids (shots), and 5) Intravitreal steroids (injected directly into the eye). The risk varies based on the type, potency, dose, and duration of use.',
          category: 'Steroids'
        },
        {
          question: 'What equipment is used to measure eye pressure?',
          answer: 'Several devices can measure eye pressure: 1) Goldmann applanation tonometer (the gold standard), 2) Non-contact tonometer (air puff test), 3) iCare tonometer (rebound tonometry), 4) Tono-Pen (handheld applanation), and 5) Ocular Response Analyzer. Your doctor will select the most appropriate method based on your specific situation.',
          category: 'Equipment'
        },
        {
          question: 'What is steroid-induced glaucoma?',
          answer: 'Steroid-induced glaucoma is a form of open-angle glaucoma that occurs as a side effect of steroid use. Steroids can cause increased eye pressure in some individuals, which can damage the optic nerve if not monitored and treated. Risk factors include family history of glaucoma, high myopia (nearsightedness), diabetes, and previous steroid response.',
          category: 'Diagnosis'
        }
      ];
      
      const { error: insertError } = await supabase
        .from('chatbot_faqs')
        .insert(initialFaqs);
      
      if (insertError) {
        console.error('Error inserting initial FAQs:', insertError);
      } else {
        console.log('Successfully inserted initial FAQ data');
      }
    } else {
      console.log(`Found ${existingFaqs.length} existing FAQs, skipping initial data insertion`);
    }
    
    // Step 4: Set up RLS policies
    console.log('Setting up RLS policies...');
    
    // Enable RLS on tables
    const enableRlsResponse = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        query: `
          ALTER TABLE chatbot_faqs ENABLE ROW LEVEL SECURITY;
          ALTER TABLE chatbot_history ENABLE ROW LEVEL SECURITY;
        `
      })
    });
    
    if (!enableRlsResponse.ok) {
      const errorText = await enableRlsResponse.text();
      console.error('Error enabling RLS:', errorText);
    } else {
      console.log('Successfully enabled RLS on tables');
    }
    
    // Create basic policies
    const createBasicPoliciesResponse = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        query: `
          -- Drop existing policies if they exist
          DROP POLICY IF EXISTS "Allow public read access to FAQs" ON chatbot_faqs;
          DROP POLICY IF EXISTS "Allow users to view their own chat history" ON chatbot_history;
          DROP POLICY IF EXISTS "Allow users to insert their own chat history" ON chatbot_history;
          
          -- Create new policies
          CREATE POLICY "Allow public read access to FAQs" 
            ON chatbot_faqs FOR SELECT 
            USING (true);
          
          CREATE POLICY "Allow users to view their own chat history" 
            ON chatbot_history FOR SELECT 
            USING (auth.uid() = user_id);
          
          CREATE POLICY "Allow users to insert their own chat history" 
            ON chatbot_history FOR INSERT 
            WITH CHECK (auth.uid() = user_id);
        `
      })
    });
    
    if (!createBasicPoliciesResponse.ok) {
      const errorText = await createBasicPoliciesResponse.text();
      console.error('Error creating basic policies:', errorText);
    } else {
      console.log('Successfully created basic policies');
    }
    
    // Check if user_roles table exists and create admin policies accordingly
    console.log('Checking for user_roles table...');
    const { error: userRolesError } = await supabase.from('user_roles').select('user_id').limit(1).maybeSingle();
    
    if (userRolesError && userRolesError.code === '42P01') {
      console.log('user_roles table does not exist, creating fallback admin policies...');
      
      const fallbackPoliciesResponse = await fetch(`${supabaseUrl}/rest/v1/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          query: `
            DROP POLICY IF EXISTS "Allow admin full access to FAQs fallback" ON chatbot_faqs;
            CREATE POLICY "Allow admin full access to FAQs fallback" 
              ON chatbot_faqs FOR ALL 
              USING (auth.uid() IN (
                SELECT id FROM auth.users WHERE email LIKE '%@admin.com'
              ));
              
            DROP POLICY IF EXISTS "Allow admins full access to chat history fallback" ON chatbot_history;
            CREATE POLICY "Allow admins full access to chat history fallback" 
              ON chatbot_history FOR ALL 
              USING (auth.uid() IN (
                SELECT id FROM auth.users WHERE email LIKE '%@admin.com'
              ));
          `
        })
      });
      
      if (!fallbackPoliciesResponse.ok) {
        const errorText = await fallbackPoliciesResponse.text();
        console.error('Error creating fallback admin policies:', errorText);
      } else {
        console.log('Successfully created fallback admin policies');
      }
    } else {
      console.log('user_roles table exists, creating role-based admin policies...');
      
      const adminPoliciesResponse = await fetch(`${supabaseUrl}/rest/v1/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          query: `
            DROP POLICY IF EXISTS "Allow admin full access to FAQs" ON chatbot_faqs;
            CREATE POLICY "Allow admin full access to FAQs" 
              ON chatbot_faqs FOR ALL 
              USING (auth.uid() IN (
                SELECT user_id FROM user_roles WHERE role = 'admin'
              ));
              
            DROP POLICY IF EXISTS "Allow admins full access to chat history" ON chatbot_history;
            CREATE POLICY "Allow admins full access to chat history" 
              ON chatbot_history FOR ALL 
              USING (auth.uid() IN (
                SELECT user_id FROM user_roles WHERE role = 'admin'
              ));
          `
        })
      });
      
      if (!adminPoliciesResponse.ok) {
        const errorText = await adminPoliciesResponse.text();
        console.error('Error creating role-based admin policies:', errorText);
      } else {
        console.log('Successfully created role-based admin policies');
      }
    }
    
    console.log('Chatbot schema setup completed successfully!');
  } catch (error) {
    console.error('Error in executeChatbotSchema:', error);
    process.exit(1);
  }
}

// Execute the function
executeChatbotSchema();