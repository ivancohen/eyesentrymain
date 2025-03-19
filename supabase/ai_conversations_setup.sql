-- ai_conversations_setup.sql
-- Creates and configures the AI conversations table

-- First create the update timestamp trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Now check if table exists and create it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'ai_conversations'
    ) THEN
        -- Create the ai_conversations table
        CREATE TABLE public.ai_conversations (
            conversation_id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            title TEXT NOT NULL,
            messages JSONB NOT NULL DEFAULT '[]'::jsonb,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        );

        -- Add comments
        COMMENT ON TABLE public.ai_conversations IS 'Stores AI assistant conversation history';
        COMMENT ON COLUMN public.ai_conversations.conversation_id IS 'Unique identifier for the conversation';
        COMMENT ON COLUMN public.ai_conversations.user_id IS 'ID of the user who owns this conversation';
        COMMENT ON COLUMN public.ai_conversations.title IS 'Title of the conversation';
        COMMENT ON COLUMN public.ai_conversations.messages IS 'JSON array of messages in the conversation';
        COMMENT ON COLUMN public.ai_conversations.created_at IS 'When the conversation was created';
        COMMENT ON COLUMN public.ai_conversations.updated_at IS 'When the conversation was last updated';

        -- Set up RLS (Row Level Security)
        ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;

        -- Create policies for access control
        -- 1. Users can see their own conversations
        CREATE POLICY ai_conversations_select_policy
            ON public.ai_conversations
            FOR SELECT
            USING (auth.uid() = user_id);

        -- 2. Users can insert their own conversations (user_id must match their ID)
        CREATE POLICY ai_conversations_insert_policy
            ON public.ai_conversations
            FOR INSERT
            WITH CHECK (auth.uid() = user_id);

        -- 3. Users can update their own conversations
        CREATE POLICY ai_conversations_update_policy
            ON public.ai_conversations
            FOR UPDATE
            USING (auth.uid() = user_id);

        -- 4. Users can delete their own conversations
        CREATE POLICY ai_conversations_delete_policy
            ON public.ai_conversations
            FOR DELETE
            USING (auth.uid() = user_id);

        -- 5. Admins can access all conversations
        CREATE POLICY ai_conversations_admin_policy
            ON public.ai_conversations
            FOR ALL
            USING (
                EXISTS (
                    SELECT 1 FROM public.profiles
                    WHERE profiles.id = auth.uid()
                    AND profiles.is_admin = true
                )
            );

        -- Create updated_at trigger
        CREATE TRIGGER set_updated_at
            BEFORE UPDATE ON public.ai_conversations
            FOR EACH ROW
            EXECUTE FUNCTION public.set_updated_at();

        RAISE NOTICE 'Created ai_conversations table with RLS policies';
    ELSE
        RAISE NOTICE 'Table ai_conversations already exists';
    END IF;
END
$$;

-- Verify table exists with proper structure
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM 
    information_schema.columns
WHERE 
    table_schema = 'public' 
    AND table_name = 'ai_conversations'
ORDER BY ordinal_position;

-- List RLS policies on the table
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM 
    pg_policies
WHERE
    schemaname = 'public'
    AND tablename = 'ai_conversations';
