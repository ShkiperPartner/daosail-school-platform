-- Migration: Role-based Knowledge Access System
-- Date: 2025-09-16
-- Phase: 4.2 - Role-based Chat Architecture

BEGIN;

-- 1. Extend knowledge_documents table with role-based access
ALTER TABLE knowledge_documents
ADD COLUMN IF NOT EXISTS access_roles text[] DEFAULT ARRAY['public'],
ADD COLUMN IF NOT EXISTS target_audience text DEFAULT 'general',
ADD COLUMN IF NOT EXISTS knowledge_level text DEFAULT 'basic';

-- Add indexes for efficient role-based queries
CREATE INDEX IF NOT EXISTS idx_knowledge_documents_access_roles
ON knowledge_documents USING GIN (access_roles);

CREATE INDEX IF NOT EXISTS idx_knowledge_documents_target_audience
ON knowledge_documents (target_audience);

CREATE INDEX IF NOT EXISTS idx_knowledge_documents_knowledge_level
ON knowledge_documents (knowledge_level);

-- 2. Create chat_messages table for individual message storage
CREATE TABLE IF NOT EXISTS chat_messages (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    chat_id uuid REFERENCES user_chats(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    role text NOT NULL CHECK (role IN ('user', 'assistant')),
    content text NOT NULL,
    metadata jsonb DEFAULT '{}',
    tokens_used integer DEFAULT 0,
    created_at timestamptz DEFAULT NOW()
);

-- Add indexes for chat_messages
CREATE INDEX IF NOT EXISTS idx_chat_messages_chat_id
ON chat_messages (chat_id);

CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id
ON chat_messages (user_id);

CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at
ON chat_messages (created_at DESC);

-- 3. Extend user_chats table with role-based information
ALTER TABLE user_chats
ADD COLUMN IF NOT EXISTS assistant_role text DEFAULT 'Навигатор',
ADD COLUMN IF NOT EXISTS access_level text DEFAULT 'public',
ADD COLUMN IF NOT EXISTS tokens_used integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS knowledge_chunks_used integer DEFAULT 0;

-- 4. Enable RLS for chat_messages
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for chat_messages
CREATE POLICY "Users can view their own messages" ON chat_messages
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own messages" ON chat_messages
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own messages" ON chat_messages
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own messages" ON chat_messages
    FOR DELETE USING (auth.uid() = user_id);

-- 5. Update existing knowledge_documents with default role access
UPDATE knowledge_documents
SET access_roles = ARRAY['public']
WHERE access_roles IS NULL OR array_length(access_roles, 1) IS NULL;

-- 6. Add helpful comments
COMMENT ON COLUMN knowledge_documents.access_roles IS 'Array of roles that can access this knowledge: public, passenger, sailor, partner, admin';
COMMENT ON COLUMN knowledge_documents.target_audience IS 'Target audience for this content: general, beginners, advanced, experts';
COMMENT ON COLUMN knowledge_documents.knowledge_level IS 'Knowledge complexity level: basic, intermediate, advanced, expert';

COMMENT ON TABLE chat_messages IS 'Individual messages in chat conversations for detailed history and analysis';
COMMENT ON COLUMN chat_messages.role IS 'Message sender: user or assistant';
COMMENT ON COLUMN chat_messages.metadata IS 'Additional message data like assistant type, knowledge sources used, etc.';
COMMENT ON COLUMN chat_messages.tokens_used IS 'OpenAI tokens consumed for this message';

COMMENT ON COLUMN user_chats.assistant_role IS 'Type of assistant used: Навигатор, Шкипер, etc.';
COMMENT ON COLUMN user_chats.access_level IS 'Highest knowledge access level used in this chat';
COMMENT ON COLUMN user_chats.tokens_used IS 'Total OpenAI tokens used in this chat';
COMMENT ON COLUMN user_chats.knowledge_chunks_used IS 'Total knowledge chunks referenced in this chat';

COMMIT;