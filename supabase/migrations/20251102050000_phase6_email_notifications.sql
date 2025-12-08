-- Phase 6: Email Notifications & Invoice Creation System
-- This migration adds email notification tracking and enhances invoice functionality

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
  v_admin RECORD;
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
    WHEN 'completed' THEN
      RETURN NEW;
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
CREATE POLICY "Admins can view all email notifications"
ON email_notifications FOR SELECT
USING (auth.jwt() ->> 'role' = 'authenticated' AND EXISTS (
  SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
));

CREATE POLICY "System can insert email notifications"
ON email_notifications FOR INSERT
WITH CHECK (true);

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
