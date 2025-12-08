# Complete Migration via Supabase Dashboard - Step by Step

> **Status:** CLI automation encountered network issues. Dashboard method is fastest and most reliable.

---

## 🎯 Quick Summary

✅ **Done:**
- All 6 migration files prepared
- Credentials ready
- Configuration identified

⏳ **To Do:**
- Copy 6 SQL files to Supabase Dashboard SQL Editor
- Run each migration (takes ~5 minutes)
- Update application config

---

## 📋 Your Credentials

```
New Project: ekswazmqhwtxzgdckpxt
URL: https://ekswazmqhwtxzgdckpxt.supabase.co
Database: postgres
Password: 3ufpu45mDG3LSp4H
```

---

## 🚀 Step-by-Step Guide

### Step 1: Go to Supabase Dashboard

1. Open: **https://app.supabase.com/**
2. Sign in with your account
3. **Select your new project:** `ekswazmqhwtxzgdckpxt`

### Step 2: Open SQL Editor

1. Left sidebar → **SQL Editor**
2. Click **New query**

### Step 3: Run 6 Migrations in Order

Below are the 6 migration files. Copy each one and run them **in order**.

---

### 📝 Migration 1 of 6: Fix RLS Policies

**File:** `20251022041141_c8359f9d-763e-4e80-bb08-0ca78d8cecbe.sql`

```sql
-- Fix infinite recursion in users table RLS policies
-- The admin check creates recursion when it references the same table

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can view all data" ON users;
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;

-- Create new policies without recursion
-- Users can always view and update their own profile
CREATE POLICY "Users can view own profile"
ON users FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON users FOR UPDATE
USING (auth.uid() = id);

-- For admin access, we'll use a simpler approach
-- Admins can do everything (checking role directly without joining)
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
```

**How to run:**
1. Copy the SQL above
2. Go to SQL Editor in Supabase
3. Paste into editor
4. Click **RUN**
5. Wait for ✓ confirmation

---

### 📝 Migration 2 of 6: Order & Invoice Number Generators

**File:** `20251023000000_create_order_number_function.sql`

```sql
-- Create function to generate sequential order numbers in IM-000001 format
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
  next_number INTEGER;
  formatted_number TEXT;
BEGIN
  -- Get the last order number and extract the numeric part
  SELECT COALESCE(MAX(
    CAST(
      SUBSTRING(order_number FROM 4) AS INTEGER
    )
  ), 0) + 1
  INTO next_number
  FROM orders
  WHERE order_number ~ '^IM-[0-9]+$';
  
  -- Format as IM-000001, IM-000002, etc.
  formatted_number := 'IM-' || LPAD(next_number::TEXT, 6, '0');
  
  RETURN formatted_number;
END;
$$ LANGUAGE plpgsql;

-- Create function to generate sequential invoice numbers in INV-YYYY-000001 format
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TEXT AS $$
DECLARE
  current_year TEXT;
  next_number INTEGER;
  formatted_number TEXT;
BEGIN
  -- Get current year
  current_year := TO_CHAR(CURRENT_DATE, 'YYYY');
  
  -- Get the last invoice number for this year and extract the numeric part
  SELECT COALESCE(MAX(
    CAST(
      SUBSTRING(invoice_number FROM 9) AS INTEGER
    )
  ), 0) + 1
  INTO next_number
  FROM invoices
  WHERE invoice_number ~ ('^INV-' || current_year || '-[0-9]+$');
  
  -- Format as INV-YYYY-000001, INV-YYYY-000002, etc.
  formatted_number := 'INV-' || current_year || '-' || LPAD(next_number::TEXT, 6, '0');
  
  RETURN formatted_number;
END;
$$ LANGUAGE plpgsql;
```

---

### 📝 Migration 3 of 6: Sequences & Atomic Numbering

**File:** `20251101192740_fix_order_number_sequence.sql`

```sql
-- Fix the order number generation to use sequences (atomic, no race conditions)

-- Create sequence for order numbers if it doesn't exist
CREATE SEQUENCE IF NOT EXISTS order_number_seq START WITH 1 INCREMENT BY 1;

-- Create sequence for invoice numbers if it doesn't exist  
CREATE SEQUENCE IF NOT EXISTS invoice_number_seq START WITH 1 INCREMENT BY 1;

-- Drop the old functions
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
```

---

### 📝 Migration 4 of 6: Admin Infrastructure

**File:** `20251102000000_create_admin_infrastructure.sql`

This is a large migration. Go to:  
`supabase/migrations/20251102000000_create_admin_infrastructure.sql`

Copy the entire file and paste into SQL Editor.

Key tables created:
- `calendar_slots` - Admin calendar management
- `admin_activity_log` - Audit trail
- `admin_settings` - Configuration
- `invoices` - Invoice tracking

---

### 📝 Migration 5 of 6: Email Notifications

**File:** `20251102050000_phase6_email_notifications.sql`

Go to: `supabase/migrations/20251102050000_phase6_email_notifications.sql`

Copy the entire file and paste into SQL Editor.

Key tables created:
- `email_notifications` - Email tracking and history
- Functions for email logging and overdue invoice detection

---

## ✅ After Running All Migrations

### Step 1: Update Configuration Files

**File:** `supabase/config.toml`

Change:
```toml
project_id = "tvuklnrtagwivkczedy"
```

To:
```toml
project_id = "ekswazmqhwtxzgdckpxt"
```

### Step 2: Create/Update `.env.local`

```env
VITE_SUPABASE_URL=https://ekswazmqhwtxzgdckpxt.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVrc3dhem1xaHd0eHpnZGNrcHh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyNDY2MzMsImV4cCI6MjA3NzgyMjYzM30.Y04J2jVcms5kRYcS15QZ8ATanQrvVvbohmUSOV07X9U
```

### Step 3: Verify in Supabase Dashboard

Check that all tables exist:

```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

You should see:
- admin_activity_log
- admin_settings
- calendar_slots
- email_notifications
- invoices
- orders
- users

---

## 🧪 Test the Application

```bash
npm install
npm run dev
```

Test these features:
- ✅ Login page loads
- ✅ Can login with existing account
- ✅ Orders page accessible
- ✅ Admin panel loads
- ✅ Can create new order
- ✅ Invoices display correctly

---

## 📊 What Each Migration Does

| # | File | Purpose |
|---|------|---------|
| 1 | 20251022041141 | Basic RLS setup for users/orders |
| 2 | 20251023000000 | Order/Invoice number generation |
| 3 | 20251101192740 | Atomic sequences for numbering |
| 4 | 20251102000000 | Admin infrastructure (calendar, logs, invoices) |
| 5 | 20251102050000 | Email notifications & tracking |

---

## 🆘 Troubleshooting

### Error: "Relation does not exist"

**Solution:** Run migrations in order. Each migration depends on previous ones.

### Error: "Function already exists"

**Solution:** This is OK. Migrations use `CREATE OR REPLACE` to handle this.

### Error: "Permission denied"

**Solution:** Make sure you're using a project account with admin privileges.

### Tables not showing up

**Solution:** Refresh the Supabase page (F5). Check the "Schemas" tab on the left.

---

## 📁 Files to Copy

All migration files are in:
```
supabase/migrations/
```

1. `20251022041141_c8359f9d-763e-4e80-bb08-0ca78d8cecbe.sql`
2. `20251022050000_fix_users_rls.sql`
3. `20251023000000_create_order_number_function.sql`
4. `20251101192740_fix_order_number_sequence.sql`
5. `20251102000000_create_admin_infrastructure.sql`
6. `20251102050000_phase6_email_notifications.sql`

---

## ✨ Complete!

Once all migrations run successfully:

1. Update config files
2. Run: `npm install && npm run dev`
3. Test the app
4. Commit to git:
   ```bash
   git add supabase/config.toml .env.local
   git commit -m "Migrate database to new Supabase project"
   ```

---

**Estimated Time:** 5-10 minutes total

All migration files are already in your project - just copy and paste! 🚀
