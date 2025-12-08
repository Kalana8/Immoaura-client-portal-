# Supabase Storage Setup for File Uploads/Downloads

This document explains how to set up Supabase storage for admin file uploads and client file downloads.

## Prerequisites

1. Supabase project created
2. Database migrations run
3. Storage bucket needs to be created

## Setup Steps

### 1. Create Storage Bucket Manually

**IMPORTANT:** Storage buckets cannot be created via SQL migrations due to permissions. You must create it manually:

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to **Storage** in the left sidebar
4. Click **"New bucket"** button
5. Configure the bucket:
   - **Name:** `admin-order-files`
   - **Public:** ❌ **NO** (unchecked - must be private)
   - **File size limit:** `52428800` (50MB)
   - **Allowed MIME types:** 
     - `image/*`
     - `application/pdf`
     - `application/zip`
     - `application/x-zip-compressed`
     - `video/*`
     - `application/msword`
     - `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
     - `application/vnd.ms-excel`
     - `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
     - `text/plain`
     - `application/octet-stream`
6. Click **"Create bucket"**

### 2. Run the Policy Migration

After creating the bucket, run the policy migration:

```bash
# If using Supabase CLI
supabase migration up

# Or run the SQL file directly in Supabase SQL Editor
# File: supabase/migrations/20251103000000_setup_file_storage.sql
```

This will create the RLS policies for file access.

### 2. Verify Storage Bucket

1. Go to Supabase Dashboard → Storage
2. Verify that `admin-order-files` bucket exists
3. Check that it's set to **Private** (not public)
4. Verify file size limit is 50MB

### 3. Verify RLS Policies

The migration creates the following policies:

- **Admins can upload files**: Admins can upload files to any order folder
- **Admins can update files**: Admins can update files they uploaded
- **Admins can delete files**: Admins can delete files
- **Clients can download their order files**: Clients can only download files from their own orders
- **Admins can view all files**: Admins can view all files

### 4. Test the Setup

#### Admin Upload Test:
1. Login as admin
2. Go to Orders page
3. Click on an order to view details
4. Click "Add Files" button
5. Upload a test file
6. Verify file appears in the list

#### Client Download Test:
1. Login as client
2. Go to Orders page
3. Click on an order that has admin-uploaded files
4. Click download button on a file
5. Verify file downloads successfully

## File Path Structure

Files are stored with the following structure:
```
admin-order-files/
  {order_id}/
    admin-uploads/
      {timestamp}-{random}.{ext}
```

Example:
```
admin-order-files/
  123e4567-e89b-12d3-a456-426614174000/
    admin-uploads/
      1699123456789-abc123.pdf
```

## Database Schema

Files are tracked in the `file_uploads` table:
- `order_id`: Links to the order
- `user_id`: Admin who uploaded the file
- `file_name`: Original filename
- `file_path`: Path in storage (relative, without bucket name)
- `file_type`: MIME type
- `file_size`: Size in bytes
- `upload_type`: 'admin-upload' for admin uploads

## Troubleshooting

### Files not uploading:
1. Check browser console for errors
2. Verify admin role in users table
3. Check storage bucket exists and is accessible
4. Verify RLS policies are active

### Clients can't download:
1. Verify file_uploads record exists
2. Check order belongs to the client
3. Verify upload_type is 'admin-upload'
4. Check RLS policies allow client access

### Storage errors:
1. Check file size (max 50MB)
2. Verify file type is allowed
3. Check storage quota
4. Verify bucket permissions

## Security Notes

- Files are stored in a private bucket
- Clients can only access files from their own orders
- Admins have full access to all files
- File paths include order ID for organization
- All uploads are logged in admin_activity_log

