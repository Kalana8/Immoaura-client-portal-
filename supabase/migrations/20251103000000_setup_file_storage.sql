-- Setup file storage bucket and policies for order files
-- This migration creates the storage bucket and RLS policies for file uploads/downloads
-- NOTE: Storage bucket must be created manually in Supabase Dashboard first
-- Then run this migration to create the policies
-- Bucket name: admin-order-files

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can upload files" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update files" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete files" ON storage.objects;
DROP POLICY IF EXISTS "Clients can download their order files" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all files" ON storage.objects;

-- Policy 1: Admins can upload files to any order folder
CREATE POLICY "Admins can upload files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'admin-order-files' AND
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Policy 2: Admins can update files they uploaded
CREATE POLICY "Admins can update files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'admin-order-files' AND
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
)
WITH CHECK (
  bucket_id = 'admin-order-files' AND
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Policy 3: Admins can delete files
CREATE POLICY "Admins can delete files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'admin-order-files' AND
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Policy 4: Clients can download files from their own orders
CREATE POLICY "Clients can download their order files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'admin-order-files' AND
  (
    -- Check if the file path contains an order_id that belongs to the client
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.client_id = auth.uid()
      AND (storage.objects.name LIKE orders.id || '/%' OR storage.objects.name LIKE '%/' || orders.id || '/%')
    )
    OR
    -- Also allow if the file is in file_uploads table for their orders
    EXISTS (
      SELECT 1 FROM file_uploads
      INNER JOIN orders ON orders.id = file_uploads.order_id
      WHERE orders.client_id = auth.uid()
      AND file_uploads.file_path = storage.objects.name
      AND file_uploads.upload_type = 'admin-upload'
    )
  )
);

-- Policy 5: Admins can view all files
CREATE POLICY "Admins can view all files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'admin-order-files' AND
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Fix file_uploads upload_type check constraint to allow 'admin-upload'
ALTER TABLE file_uploads 
DROP CONSTRAINT IF EXISTS file_uploads_upload_type_check;

ALTER TABLE file_uploads
ADD CONSTRAINT file_uploads_upload_type_check 
CHECK (upload_type IN ('client-upload', 'admin-upload'));

-- Enable RLS on file_uploads table if not already enabled
ALTER TABLE file_uploads ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Clients can view their order files" ON file_uploads;
DROP POLICY IF EXISTS "Admins can view all file uploads" ON file_uploads;
DROP POLICY IF EXISTS "Users can insert their own file uploads" ON file_uploads;
DROP POLICY IF EXISTS "Admins can insert file uploads" ON file_uploads;

-- Policy 1: Clients can view file_uploads for their own orders
CREATE POLICY "Clients can view their order files"
ON file_uploads FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = file_uploads.order_id
    AND orders.client_id = auth.uid()
  )
);

-- Policy 2: Admins can view all file_uploads
CREATE POLICY "Admins can view all file uploads"
ON file_uploads FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Policy 3: Users can insert their own file uploads (for client uploads)
CREATE POLICY "Users can insert their own file uploads"
ON file_uploads FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = file_uploads.order_id
    AND orders.client_id = auth.uid()
  )
);

-- Policy 4: Admins can insert file uploads for any order
CREATE POLICY "Admins can insert file uploads"
ON file_uploads FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Create index on file_uploads for better query performance
CREATE INDEX IF NOT EXISTS idx_file_uploads_order_id ON file_uploads(order_id);
CREATE INDEX IF NOT EXISTS idx_file_uploads_upload_type ON file_uploads(upload_type);
CREATE INDEX IF NOT EXISTS idx_file_uploads_order_type ON file_uploads(order_id, upload_type);

