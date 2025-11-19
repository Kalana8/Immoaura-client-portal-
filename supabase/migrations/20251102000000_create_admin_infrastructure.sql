-- Phase 1: Admin Panel Foundation - Database Infrastructure

-- 1. Add admin role to users table
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

-- 6. Create invoices table if it doesn't exist (for admin invoicing)
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

-- 14. Create sequence for invoice numbers
CREATE SEQUENCE IF NOT EXISTS invoice_number_seq START WITH 1 INCREMENT BY 1;

-- 15. Create function to log admin actions
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
