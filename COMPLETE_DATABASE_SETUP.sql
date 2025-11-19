-- ============================================================================
-- IMMOAURA CLIENT PORTAL - COMPLETE DATABASE SETUP
-- ============================================================================
-- This file contains ALL database migrations and setup instructions
-- Run this file in Supabase SQL Editor to set up the entire database
-- 
-- IMPORTANT: Read all instructions before running!
-- ============================================================================

-- ============================================================================
-- PART 1: MANUAL SETUP INSTRUCTIONS (DO THESE FIRST)
-- ============================================================================

/*
================================================================================
STEP 1: CREATE STORAGE BUCKETS (MUST BE DONE MANUALLY)
================================================================================

Storage buckets cannot be created via SQL. You must create them in Supabase Dashboard:

1. Go to Supabase Dashboard: https://app.supabase.com
2. Select your project
3. Go to "Storage" section in the left sidebar
4. Click "New bucket"

BUCKET 1: admin-order-files
   - Name: admin-order-files
   - Public: NO (unchecked - private bucket)
   - File size limit: 52428800 (50MB)
   - Allowed MIME types:
     image/*
     application/pdf
     application/zip
     application/x-zip-compressed
     video/*
     application/msword
     application/vnd.openxmlformats-officedocument.wordprocessingml.document
     application/vnd.ms-excel
     application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
     text/plain
     application/octet-stream
   - Click "Create bucket"

BUCKET 2: order-files (for client uploads during order creation)
   - Name: order-files
   - Public: NO (unchecked - private bucket)
   - File size limit: 52428800 (50MB)
   - Allowed MIME types: Same as above
   - Click "Create bucket"

BUCKET 3: invoices (for invoice PDFs)
   - Name: invoices
   - Public: NO (unchecked - private bucket)
   - File size limit: 10485760 (10MB)
   - Allowed MIME types: application/pdf
   - Click "Create bucket"

After creating all buckets, continue with the SQL below.

================================================================================
STEP 2: CONFIGURE SUPABASE AUTHENTICATION REDIRECT URLS
================================================================================

1. Go to Supabase Dashboard → Authentication → URL Configuration
2. Add to "Redirect URLs":
   - https://yourdomain.com
   - https://yourdomain.com/auth
   - https://yourdomain.com/dashboard
   - https://yourdomain.com/reset-password
3. Set "Site URL" to: https://yourdomain.com

================================================================================
STEP 3: RUN THIS SQL FILE
================================================================================

Copy and paste the entire SQL below into Supabase SQL Editor and run it.
The migrations will run in the correct order automatically.

================================================================================
*/

-- ============================================================================
-- PART 2: INITIAL SCHEMA (if tables don't exist, create them first)
-- ============================================================================

-- Note: If you're starting fresh, you may need to create the base tables first.
-- These are typically created by Supabase Auth, but we'll ensure they exist.

-- Create users table (if not exists - usually created by Supabase Auth)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  business_name TEXT,
  role TEXT DEFAULT 'client' CHECK (role IN ('client', 'admin')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  order_number TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'in_review' CHECK (status IN ('in_review', 'confirmed', 'planned', 'delivered', 'completed')),
  total_price_incl_vat DECIMAL(12, 2) NOT NULL DEFAULT 0,
  admin_notes TEXT,
  calendar_slot_id UUID,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create file_uploads table
CREATE TABLE IF NOT EXISTS file_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  upload_type TEXT NOT NULL DEFAULT 'client-upload' CHECK (upload_type IN ('client-upload', 'admin-upload')),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create messages table
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

-- Create order_status_history table
CREATE TABLE IF NOT EXISTS order_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  changed_by UUID REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- PART 3: MIGRATION 1 - Fix users RLS and orders status constraint
-- ============================================================================

-- Fix infinite recursion in users table RLS policies
DROP POLICY IF EXISTS "Admins can view all data" ON users;
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;

-- Create new policies without recursion
CREATE POLICY "Users can view own profile"
ON users FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON users FOR UPDATE
USING (auth.uid() = id);

-- For admin access, we'll use a simpler approach
CREATE POLICY "Admin full access"
ON users FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.raw_user_meta_data->>'role' = 'admin'
  )
);

-- Add status column to orders table if it doesn't have proper constraint
ALTER TABLE orders 
DROP CONSTRAINT IF EXISTS orders_status_check;

ALTER TABLE orders
ADD CONSTRAINT orders_status_check 
CHECK (status IN ('in_review', 'confirmed', 'planned', 'delivered', 'completed'));

-- Add index for better performance on status queries
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_client_status ON orders(client_id, status);

-- ============================================================================
-- PART 4: MIGRATION 2 - Fix RLS policies for users table
-- ============================================================================

-- Ensure authenticated users have necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON TABLE public.users TO authenticated;
GRANT SELECT ON TABLE public.orders TO authenticated;
GRANT INSERT ON TABLE public.orders TO authenticated;

-- Drop all existing policies on users table
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Admin full access" ON users;
DROP POLICY IF EXISTS "Users can view for FK checks" ON users;

-- Recreate simplified RLS policies
CREATE POLICY "Users can view own profile"
ON users FOR SELECT
USING (auth.uid() = id);

-- Policy 2: Users can SELECT any row (needed for foreign key checks during order creation)
CREATE POLICY "Users can view for FK checks"
ON users FOR SELECT
TO authenticated
USING (true);

-- Policy 3: Users can UPDATE their own row
CREATE POLICY "Users can update own profile"
ON users FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Policy 4: Users can INSERT their own row (for user registration)
CREATE POLICY "Users can insert own profile"
ON users FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Ensure RLS is enabled on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PART 5: MIGRATION 3 - Create order and invoice number generation functions
-- ============================================================================

-- Create sequence for order numbers if it doesn't exist
CREATE SEQUENCE IF NOT EXISTS order_number_seq START WITH 1 INCREMENT BY 1;

-- Create sequence for invoice numbers if it doesn't exist  
CREATE SEQUENCE IF NOT EXISTS invoice_number_seq START WITH 1 INCREMENT BY 1;

-- Drop the old functions if they exist
DROP FUNCTION IF EXISTS generate_order_number() CASCADE;
DROP FUNCTION IF EXISTS generate_invoice_number() CASCADE;

-- Recreate order number function using sequence
CREATE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
  next_number INTEGER;
  formatted_number TEXT;
BEGIN
  -- Use sequence to get atomic incrementing number
  next_number := nextval('order_number_seq');
  
  -- Format as IM-000001, IM-000002, etc.
  formatted_number := 'IM-' || LPAD(next_number::TEXT, 6, '0');
  
  RETURN formatted_number;
END;
$$ LANGUAGE plpgsql;

-- Recreate invoice number function using sequence
CREATE FUNCTION generate_invoice_number()
RETURNS TEXT AS $$
DECLARE
  current_year TEXT;
  next_number INTEGER;
  formatted_number TEXT;
BEGIN
  -- Get current year
  current_year := TO_CHAR(CURRENT_DATE, 'YYYY');
  
  -- Use sequence to get atomic incrementing number
  next_number := nextval('invoice_number_seq');
  
  -- Format as INV-YYYY-000001, INV-YYYY-000002, etc.
  formatted_number := 'INV-' || current_year || '-' || LPAD(next_number::TEXT, 6, '0');
  
  RETURN formatted_number;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PART 6: MIGRATION 4 - Admin infrastructure (calendar, activity log, invoices)
-- ============================================================================

-- 1. Add admin role to users table (if not already added)
ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'client' CHECK (role IN ('client', 'admin'));
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- 2. Create calendar_slots table for global availability management
CREATE TABLE IF NOT EXISTS calendar_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('open', 'blackout', 'booked')),
  booked_by_order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(date, start_time, end_time)
);

CREATE INDEX IF NOT EXISTS idx_calendar_slots_date ON calendar_slots(date);
CREATE INDEX IF NOT EXISTS idx_calendar_slots_status ON calendar_slots(status);
CREATE INDEX IF NOT EXISTS idx_calendar_slots_booked_order ON calendar_slots(booked_by_order_id);

-- 3. Create admin_activity_log table for audit trail
CREATE TABLE IF NOT EXISTS admin_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  target_table TEXT NOT NULL,
  target_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_activity_log_admin_id ON admin_activity_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_activity_log_created_at ON admin_activity_log(created_at);
CREATE INDEX IF NOT EXISTS idx_admin_activity_log_action ON admin_activity_log(action);

-- 4. Create admin_settings table for configuration
CREATE TABLE IF NOT EXISTS admin_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 5. Add admin-specific columns to orders table if they don't exist
ALTER TABLE orders ADD COLUMN IF NOT EXISTS admin_notes TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS calendar_slot_id UUID REFERENCES calendar_slots(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_orders_calendar_slot_id ON orders(calendar_slot_id);

-- 6. Create invoices table if it doesn't exist
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  invoice_number TEXT UNIQUE NOT NULL,
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  amount_excl_vat DECIMAL(12, 2) NOT NULL,
  vat_amount DECIMAL(12, 2) NOT NULL,
  amount_incl_vat DECIMAL(12, 2) NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'partial', 'paid')),
  pdf_path TEXT,
  pdf_uploaded_at TIMESTAMP,
  notes TEXT,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoices_order_id ON invoices(order_id);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_payment_status ON invoices(payment_status);
CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON invoices(created_at);

-- 7. Enable RLS on all admin tables
ALTER TABLE calendar_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- 8. RLS Policies for calendar_slots
DROP POLICY IF EXISTS "Admins can view all calendar slots" ON calendar_slots;
CREATE POLICY "Admins can view all calendar slots"
ON calendar_slots FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() AND users.role = 'admin'
  )
);

DROP POLICY IF EXISTS "Admins can manage calendar slots" ON calendar_slots;
CREATE POLICY "Admins can manage calendar slots"
ON calendar_slots FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() AND users.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() AND users.role = 'admin'
  )
);

-- 9. RLS Policies for admin_activity_log
DROP POLICY IF EXISTS "Admins can view activity logs" ON admin_activity_log;
CREATE POLICY "Admins can view activity logs"
ON admin_activity_log FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() AND users.role = 'admin'
  )
);

DROP POLICY IF EXISTS "Only system can insert activity logs" ON admin_activity_log;
CREATE POLICY "Only system can insert activity logs"
ON admin_activity_log FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() AND users.role = 'admin'
  )
);

-- 10. RLS Policies for admin_settings
DROP POLICY IF EXISTS "Admins can view admin settings" ON admin_settings;
CREATE POLICY "Admins can view admin settings"
ON admin_settings FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() AND users.role = 'admin'
  )
);

DROP POLICY IF EXISTS "Admins can manage admin settings" ON admin_settings;
CREATE POLICY "Admins can manage admin settings"
ON admin_settings FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() AND users.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() AND users.role = 'admin'
  )
);

-- 11. RLS Policies for invoices
DROP POLICY IF EXISTS "Clients can view own invoices" ON invoices;
CREATE POLICY "Clients can view own invoices"
ON invoices FOR SELECT
TO authenticated
USING (
  auth.uid() = (
    SELECT client_id FROM orders WHERE orders.id = invoices.order_id
  )
  OR
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() AND users.role = 'admin'
  )
);

DROP POLICY IF EXISTS "Admins can manage invoices" ON invoices;
CREATE POLICY "Admins can manage invoices"
ON invoices FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() AND users.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() AND users.role = 'admin'
  )
);

-- 12. Update RLS for orders table - admins can view all
DROP POLICY IF EXISTS "Admins can view all orders" ON orders;
CREATE POLICY "Admins can view all orders"
ON orders FOR SELECT
TO authenticated
USING (
  auth.uid() = client_id
  OR
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() AND users.role = 'admin'
  )
);

DROP POLICY IF EXISTS "Admins can manage all orders" ON orders;
CREATE POLICY "Admins can manage all orders"
ON orders FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() AND users.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() AND users.role = 'admin'
  )
);

-- 13. Grant permissions for authenticated users
GRANT SELECT, INSERT, UPDATE ON calendar_slots TO authenticated;
GRANT SELECT, INSERT ON admin_activity_log TO authenticated;
GRANT SELECT, UPDATE ON admin_settings TO authenticated;
GRANT SELECT, INSERT, UPDATE ON invoices TO authenticated;
GRANT SELECT, UPDATE ON orders TO authenticated;

-- 14. Create function to log admin actions
CREATE OR REPLACE FUNCTION log_admin_action(
  p_admin_id UUID,
  p_action TEXT,
  p_target_table TEXT,
  p_target_id UUID,
  p_old_values JSONB DEFAULT NULL,
  p_new_values JSONB DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO admin_activity_log (
    admin_id,
    action,
    target_table,
    target_id,
    old_values,
    new_values,
    ip_address,
    user_agent
  ) VALUES (
    p_admin_id,
    p_action,
    p_target_table,
    p_target_id,
    p_old_values,
    p_new_values,
    current_setting('request.headers')::json->>'cf-connecting-ip',
    current_setting('request.headers')::json->>'user-agent'
  )
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PART 7: MIGRATION 5 - Email notifications system
-- ============================================================================

-- 1. Create email_notifications table to track all sent emails
CREATE TABLE IF NOT EXISTS email_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_email TEXT NOT NULL,
  recipient_name TEXT,
  email_type TEXT NOT NULL CHECK (email_type IN (
    'order_submitted',
    'order_confirmed', 
    'order_planned',
    'order_delivered',
    'invoice_created',
    'invoice_overdue',
    'invoice_paid'
  )),
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  related_order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  related_invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'bounced')),
  sent_at TIMESTAMP,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_notifications_status ON email_notifications(status);
CREATE INDEX IF NOT EXISTS idx_email_notifications_type ON email_notifications(email_type);
CREATE INDEX IF NOT EXISTS idx_email_notifications_order ON email_notifications(related_order_id);
CREATE INDEX IF NOT EXISTS idx_email_notifications_invoice ON email_notifications(related_invoice_id);
CREATE INDEX IF NOT EXISTS idx_email_notifications_created ON email_notifications(created_at DESC);

-- 2. Add columns to invoices table for tracking
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS pdf_uploaded_at TIMESTAMP;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS created_by UUID NOT NULL DEFAULT (auth.uid()) REFERENCES users(id) ON DELETE CASCADE;

-- 3. Create function to generate year-scoped invoice numbers
CREATE OR REPLACE FUNCTION generate_invoice_number() 
RETURNS TEXT AS $$
DECLARE
  v_year_seq INTEGER;
  v_invoice_number TEXT;
BEGIN
  -- Get or create sequence for current year
  v_year_seq := nextval('invoice_number_seq'::regclass);
  v_invoice_number := 'INV-' || TO_CHAR(CURRENT_DATE, 'YYYY') || '-' || LPAD(v_year_seq::TEXT, 6, '0');
  RETURN v_invoice_number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create function to log email notifications
CREATE OR REPLACE FUNCTION log_email_notification(
  p_recipient_email TEXT,
  p_recipient_name TEXT,
  p_email_type TEXT,
  p_subject TEXT,
  p_body TEXT,
  p_order_id UUID DEFAULT NULL,
  p_invoice_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO email_notifications (
    recipient_email,
    recipient_name,
    email_type,
    subject,
    body,
    related_order_id,
    related_invoice_id,
    status
  ) VALUES (
    p_recipient_email,
    p_recipient_name,
    p_email_type,
    p_subject,
    p_body,
    p_order_id,
    p_invoice_id,
    'pending'
  )
  RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create function to trigger email on order status change
CREATE OR REPLACE FUNCTION trigger_order_status_email()
RETURNS TRIGGER AS $$
DECLARE
  v_client RECORD;
  v_subject TEXT;
  v_body TEXT;
  v_email_type TEXT;
BEGIN
  -- Only trigger on status change
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- Get client info
  SELECT email, full_name, business_name INTO v_client 
  FROM users WHERE id = NEW.client_id;

  -- Determine email type and body based on status
  CASE NEW.status
    WHEN 'confirmed' THEN
      v_email_type := 'order_confirmed';
      v_subject := 'Order ' || NEW.order_number || ' Confirmed!';
      v_body := 'Your order has been confirmed. Awaiting slot assignment.';
    WHEN 'planned' THEN
      v_email_type := 'order_planned';
      v_subject := 'Order ' || NEW.order_number || ' Scheduled';
      v_body := 'Your order has been scheduled. Check your calendar for details.';
    WHEN 'delivered' THEN
      v_email_type := 'order_delivered';
      v_subject := 'Order ' || NEW.order_number || ' Delivered';
      v_body := 'Your deliverables are ready for download. Invoice available.';
    ELSE
      RETURN NEW;
  END CASE;

  -- Log email notification
  PERFORM log_email_notification(
    v_client.email,
    v_client.full_name,
    v_email_type,
    v_subject,
    v_body,
    NEW.id,
    NULL
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Create trigger for order status changes
DROP TRIGGER IF EXISTS order_status_email_trigger ON orders;
CREATE TRIGGER order_status_email_trigger
AFTER UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION trigger_order_status_email();

-- 7. Enable RLS on email_notifications
ALTER TABLE email_notifications ENABLE ROW LEVEL SECURITY;

-- 8. RLS Policies for email_notifications
DROP POLICY IF EXISTS "Admins can view all email notifications" ON email_notifications;
CREATE POLICY "Admins can view all email notifications"
ON email_notifications FOR SELECT
USING (auth.jwt() ->> 'role' = 'authenticated' AND EXISTS (
  SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
));

DROP POLICY IF EXISTS "System can insert email notifications" ON email_notifications;
CREATE POLICY "System can insert email notifications"
ON email_notifications FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can update email notifications" ON email_notifications;
CREATE POLICY "Admins can update email notifications"
ON email_notifications FOR UPDATE
USING (auth.jwt() ->> 'role' = 'authenticated' AND EXISTS (
  SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
));

-- 9. Grant permissions for authenticated users
GRANT SELECT, INSERT, UPDATE ON email_notifications TO authenticated;

-- 10. Create function to handle overdue invoice detection
CREATE OR REPLACE FUNCTION check_overdue_invoices()
RETURNS TABLE(invoice_id UUID, email TEXT, invoice_number TEXT, days_overdue INTEGER) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.id,
    u.email,
    i.invoice_number,
    EXTRACT(DAY FROM CURRENT_DATE - i.due_date)::INTEGER as days_overdue
  FROM invoices i
  JOIN orders o ON i.order_id = o.id
  JOIN users u ON o.client_id = u.id
  WHERE i.payment_status != 'paid'
    AND i.due_date < CURRENT_DATE
    AND NOT EXISTS (
      SELECT 1 FROM email_notifications 
      WHERE related_invoice_id = i.id 
        AND email_type = 'invoice_overdue'
        AND created_at > CURRENT_DATE - INTERVAL '1 day'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Update admin_activity_log for invoice creation
ALTER TABLE admin_activity_log ADD COLUMN IF NOT EXISTS metadata JSONB;

-- 12. Create view for invoice creation workflow
CREATE OR REPLACE VIEW available_orders_for_invoice AS
SELECT 
  o.id,
  o.order_number,
  o.total_price_incl_vat,
  u.email,
  u.full_name,
  u.business_name,
  COALESCE(i.id, NULL) as existing_invoice_id
FROM orders o
JOIN users u ON o.client_id = u.id
LEFT JOIN invoices i ON o.id = i.order_id
WHERE o.status IN ('delivered', 'completed', 'planned', 'confirmed')
  AND i.id IS NULL
ORDER BY o.created_at DESC;

-- 13. Grant permissions for views
GRANT SELECT ON available_orders_for_invoice TO authenticated;

-- ============================================================================
-- PART 8: MIGRATION 6 - Messages table setup
-- ============================================================================

-- Create indexes for messages table
CREATE INDEX IF NOT EXISTS idx_messages_recipient_id ON messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON messages(recipient_id, is_read);

-- Enable RLS on messages
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to insert messages" ON messages;
DROP POLICY IF EXISTS "Users can view their own received messages" ON messages;
DROP POLICY IF EXISTS "Users can update their own message read status" ON messages;
DROP POLICY IF EXISTS "Users can delete their own received messages" ON messages;

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

-- ============================================================================
-- PART 9: MIGRATION 7 - File storage setup
-- ============================================================================

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

-- ============================================================================
-- PART 10: STORAGE BUCKET POLICIES (Run after creating buckets manually)
-- ============================================================================

-- IMPORTANT: These policies require the storage buckets to be created first!
-- See PART 1 for manual bucket creation instructions.

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can upload files" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update files" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete files" ON storage.objects;
DROP POLICY IF EXISTS "Clients can download their order files" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all files" ON storage.objects;
DROP POLICY IF EXISTS "Clients can upload order files" ON storage.objects;
DROP POLICY IF EXISTS "Clients can view invoice PDFs" ON storage.objects;

-- ============================================================================
-- BUCKET: admin-order-files (Admin uploads for clients)
-- ============================================================================

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

-- ============================================================================
-- BUCKET: order-files (Client uploads during order creation)
-- ============================================================================

-- Policy: Clients can upload files for their own orders
CREATE POLICY "Clients can upload order files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'order-files' AND
  EXISTS (
    SELECT 1 FROM orders
    WHERE orders.client_id = auth.uid()
    AND (storage.objects.name LIKE orders.id || '/%' OR storage.objects.name LIKE '%/' || orders.id || '/%')
  )
);

-- Policy: Clients can view their own uploaded files
CREATE POLICY "Clients can view their uploaded files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'order-files' AND
  EXISTS (
    SELECT 1 FROM orders
    WHERE orders.client_id = auth.uid()
    AND (storage.objects.name LIKE orders.id || '/%' OR storage.objects.name LIKE '%/' || orders.id || '/%')
  )
  OR
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- ============================================================================
-- BUCKET: invoices (Invoice PDFs)
-- ============================================================================

-- Policy: Admins can upload invoice PDFs
CREATE POLICY "Admins can upload invoice PDFs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'invoices' AND
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Policy: Clients can view invoice PDFs for their own invoices
CREATE POLICY "Clients can view invoice PDFs"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'invoices' AND
  (
    EXISTS (
      SELECT 1 FROM invoices
      INNER JOIN orders ON orders.id = invoices.order_id
      WHERE orders.client_id = auth.uid()
      AND invoices.pdf_path = storage.objects.name
    )
    OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  )
);

-- Policy: Admins can view all invoice PDFs
CREATE POLICY "Admins can view all invoice PDFs"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'invoices' AND
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- ============================================================================
-- PART 11: FINAL SETUP - Create admin user (if needed)
-- ============================================================================

/*
================================================================================
TO CREATE AN ADMIN USER:
================================================================================

1. Sign up a user through the application (or create via Supabase Auth)
2. Update their role to 'admin':

UPDATE users 
SET role = 'admin' 
WHERE email = 'admin@yourdomain.com';

3. Verify the admin role:

SELECT id, email, role FROM users WHERE role = 'admin';

================================================================================
*/

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check all sequences exist
SELECT sequence_name 
FROM information_schema.sequences 
WHERE sequence_schema = 'public';

-- Check all functions exist
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_type = 'FUNCTION'
ORDER BY routine_name;

-- Check RLS is enabled on all tables
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- ============================================================================
-- SETUP COMPLETE!
-- ============================================================================
-- 
-- Your database is now fully configured!
-- 
-- Next steps:
-- 1. Verify all tables were created
-- 2. Create an admin user (see PART 11)
-- 3. Test the application
-- 4. Configure Supabase Authentication redirect URLs (see PART 1)
-- 
-- ============================================================================

