-- Fix file_uploads upload_type check constraint to allow 'admin-upload'
-- This migration updates the constraint to include the new upload type

-- First, drop the existing constraint
ALTER TABLE file_uploads 
DROP CONSTRAINT IF EXISTS file_uploads_upload_type_check;

-- Recreate the constraint with all allowed values
ALTER TABLE file_uploads
ADD CONSTRAINT file_uploads_upload_type_check 
CHECK (upload_type IN ('client-upload', 'admin-upload'));

