-- Allow plan2d-uploads and plan3d-uploads upload types for 2D and 3D plan documents
-- This migration updates the constraint to include the new upload types

-- Drop the existing constraint
ALTER TABLE file_uploads 
DROP CONSTRAINT IF EXISTS file_uploads_upload_type_check;

-- Recreate the constraint with all allowed values including plan upload types
ALTER TABLE file_uploads
ADD CONSTRAINT file_uploads_upload_type_check 
CHECK (upload_type IN ('client-upload', 'admin-upload', 'plan2d-uploads', 'plan3d-uploads', 'video-logo', 'video-music'));

