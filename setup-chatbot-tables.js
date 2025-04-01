import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Create Supabase client
// Check for both naming conventions to be compatible with the project's .env file
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Supabase URL or Service Key not found in environment variables.');
  console.error('Please make sure you have the following in your .env file:');
  console.error('- NEXT_PUBLIC_SUPABASE_URL or VITE_SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_KEY or VITE_SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupChatbotTables() {
  try {
    console.log('Setting up chatbot tables...');

    // Create FAQ categories table
    console.log('Checking if chatbot_faq_categories table exists...');
    let categoriesError = null;
    try {
      const { error } = await supabase
        .from('chatbot_faq_categories')
        .select('id')
        .limit(1);
      categoriesError = error;
    } catch (error) {
      categoriesError = { message: 'Table does not exist' };
    }

    if (categoriesError) {
      console.log('Creating chatbot_faq_categories table...');
      const { error } = await supabase.rpc('create_table', {
        table_name: 'chatbot_faq_categories',
        definition: `
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          name VARCHAR(255) NOT NULL,
          description TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          created_by UUID REFERENCES auth.users(id),
          is_active BOOLEAN DEFAULT TRUE
        `
      });
      
      if (error) {
        console.error('Error creating chatbot_faq_categories table:', error);
      } else {
        console.log('chatbot_faq_categories table created successfully.');
      }
    } else {
      console.log('chatbot_faq_categories table already exists.');
    }

    // Create FAQs table
    console.log('Checking if chatbot_faqs table exists...');
    let faqsError = null;
    try {
      const { error } = await supabase
        .from('chatbot_faqs')
        .select('id')
        .limit(1);
      faqsError = error;
    } catch (error) {
      faqsError = { message: 'Table does not exist' };
    }

    if (faqsError) {
      console.log('Creating chatbot_faqs table...');
      const { error } = await supabase.rpc('create_table', {
        table_name: 'chatbot_faqs',
        definition: `
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          category_id UUID REFERENCES chatbot_faq_categories(id) ON DELETE CASCADE,
          question TEXT NOT NULL,
          answer TEXT NOT NULL,
          priority INTEGER DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          created_by UUID REFERENCES auth.users(id),
          is_active BOOLEAN DEFAULT TRUE
        `
      });
      
      if (error) {
        console.error('Error creating chatbot_faqs table:', error);
      } else {
        console.log('chatbot_faqs table created successfully.');
      }
    } else {
      console.log('chatbot_faqs table already exists.');
    }

    // Create conversations table
    console.log('Checking if chatbot_conversations table exists...');
    let conversationsError = null;
    try {
      const { error } = await supabase
        .from('chatbot_conversations')
        .select('id')
        .limit(1);
      conversationsError = error;
    } catch (error) {
      conversationsError = { message: 'Table does not exist' };
    }

    if (conversationsError) {
      console.log('Creating chatbot_conversations table...');
      const { error } = await supabase.rpc('create_table', {
        table_name: 'chatbot_conversations',
        definition: `
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
          messages JSONB DEFAULT '[]'::JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        `
      });
      
      if (error) {
        console.error('Error creating chatbot_conversations table:', error);
      } else {
        console.log('chatbot_conversations table created successfully.');
      }
    } else {
      console.log('chatbot_conversations table already exists.');
    }

    // Create functions
    console.log('Creating functions...');
    
    // Create get_conversation_history function
    const { error: getConversationError } = await supabase.rpc('create_function', {
      function_name: 'get_conversation_history',
      definition: `
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
      `
    });
    
    if (getConversationError) {
      console.error('Error creating get_conversation_history function:', getConversationError);
    } else {
      console.log('get_conversation_history function created successfully.');
    }
    
    // Create save_conversation function
    const { error: saveConversationError } = await supabase.rpc('create_function', {
      function_name: 'save_conversation',
      definition: `
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
      `
    });
    
    if (saveConversationError) {
      console.error('Error creating save_conversation function:', saveConversationError);
    } else {
      console.log('save_conversation function created successfully.');
    }
    
    // Create search_faqs function
    const { error: searchFaqsError } = await supabase.rpc('create_function', {
      function_name: 'search_faqs',
      definition: `
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
      `
    });
    
    if (searchFaqsError) {
      console.error('Error creating search_faqs function:', searchFaqsError);
    } else {
      console.log('search_faqs function created successfully.');
    }

    // Enable RLS and create policies
    console.log('Setting up RLS policies...');
    
    // Enable RLS on tables
    const { error: rlsCategoriesError } = await supabase.rpc('execute_sql', {
      sql: 'ALTER TABLE chatbot_faq_categories ENABLE ROW LEVEL SECURITY;'
    });
    
    if (rlsCategoriesError) {
      console.error('Error enabling RLS on chatbot_faq_categories:', rlsCategoriesError);
    } else {
      console.log('RLS enabled on chatbot_faq_categories.');
    }
    
    const { error: rlsFaqsError } = await supabase.rpc('execute_sql', {
      sql: 'ALTER TABLE chatbot_faqs ENABLE ROW LEVEL SECURITY;'
    });
    
    if (rlsFaqsError) {
      console.error('Error enabling RLS on chatbot_faqs:', rlsFaqsError);
    } else {
      console.log('RLS enabled on chatbot_faqs.');
    }
    
    const { error: rlsConversationsError } = await supabase.rpc('execute_sql', {
      sql: 'ALTER TABLE chatbot_conversations ENABLE ROW LEVEL SECURITY;'
    });
    
    if (rlsConversationsError) {
      console.error('Error enabling RLS on chatbot_conversations:', rlsConversationsError);
    } else {
      console.log('RLS enabled on chatbot_conversations.');
    }
    
    // Create RLS policies
    const { error: policyCategoriesError } = await supabase.rpc('execute_sql', {
      sql: `
        CREATE POLICY admin_all_chatbot_faq_categories ON chatbot_faq_categories
          FOR ALL TO authenticated
          USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));
      `
    });
    
    if (policyCategoriesError) {
      console.error('Error creating policy for chatbot_faq_categories:', policyCategoriesError);
    } else {
      console.log('Policy created for chatbot_faq_categories.');
    }
    
    const { error: policyFaqsError } = await supabase.rpc('execute_sql', {
      sql: `
        CREATE POLICY admin_all_chatbot_faqs ON chatbot_faqs
          FOR ALL TO authenticated
          USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));
      `
    });
    
    if (policyFaqsError) {
      console.error('Error creating policy for chatbot_faqs:', policyFaqsError);
    } else {
      console.log('Policy created for chatbot_faqs.');
    }
    
    const { error: policyConversationsError } = await supabase.rpc('execute_sql', {
      sql: `
        CREATE POLICY user_select_own_conversations ON chatbot_conversations
          FOR SELECT TO authenticated
          USING (user_id = auth.uid());
      `
    });
    
    if (policyConversationsError) {
      console.error('Error creating policy for chatbot_conversations:', policyConversationsError);
    } else {
      console.log('Policy created for chatbot_conversations.');
    }

    console.log('Chatbot tables setup completed.');
  } catch (error) {
    console.error('Error setting up chatbot tables:', error);
  }
}

// Execute the function
setupChatbotTables();