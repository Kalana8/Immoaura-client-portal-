-- Create messages table for admin-to-user communication
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(100) NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  read_at TIMESTAMP,
  CONSTRAINT valid_title CHECK (length(title) > 0),
  CONSTRAINT valid_content CHECK (length(content) > 0)
);

-- Create indexes for performance
CREATE INDEX idx_messages_recipient_id ON messages(recipient_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX idx_messages_is_read ON messages(recipient_id, is_read);

-- Enable RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- DISABLE RLS for now to allow admin to insert (or add proper policies)
-- ALTER TABLE messages DISABLE ROW LEVEL SECURITY;

-- RLS Policy: Allow authenticated users (admin) to INSERT messages
CREATE POLICY "Allow authenticated users to insert messages" 
ON messages FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- RLS Policy: Users can view their own received messages
CREATE POLICY "Users can view their own received messages" 
ON messages FOR SELECT 
TO authenticated 
USING (recipient_id = auth.uid() OR sender_id = auth.uid());

-- RLS Policy: Update is_read status for own messages
CREATE POLICY "Users can update their own message read status" 
ON messages FOR UPDATE 
TO authenticated 
USING (recipient_id = auth.uid())
WITH CHECK (recipient_id = auth.uid());

-- RLS Policy: Delete own received messages
CREATE POLICY "Users can delete their own received messages" 
ON messages FOR DELETE 
TO authenticated 
USING (recipient_id = auth.uid());

-- Grant permissions
GRANT ALL ON messages TO authenticated;
GRANT SELECT ON messages TO authenticated;
GRANT INSERT ON messages TO authenticated;
GRANT UPDATE (is_read, read_at) ON messages TO authenticated;
GRANT DELETE ON messages TO authenticated;

-- Create a view for unread messages count
CREATE OR REPLACE VIEW unread_messages_count AS
SELECT 
  recipient_id,
  COUNT(*) as unread_count
FROM messages
WHERE is_read = FALSE
GROUP BY recipient_id;

-- Grant access to the view
GRANT SELECT ON unread_messages_count TO authenticated;
