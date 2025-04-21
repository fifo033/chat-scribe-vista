-- Add read column to chats table
ALTER TABLE chats ADD COLUMN read BOOLEAN DEFAULT FALSE; 