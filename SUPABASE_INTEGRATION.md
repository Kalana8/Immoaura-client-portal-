# Supabase Integration Reference

## New Project Credentials

### Project Information
- **Project Name:** Immoaura Client Portal
- **Project ID:** `ekswazmqhwtxzgdckpxt`
- **Project URL:** `https://ekswazmqhwtxzgdckpxt.supabase.co`
- **Region:** (Check Supabase Dashboard for specific region)
- **Database:** PostgreSQL

### API Keys
- **Public Anon Key:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVrc3dhem1xaHd0eHpnZGNrcHh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyNDY2MzMsImV4cCI6MjA3NzgyMjYzM30.Y04J2jVcms5kRYcS15QZ8ATanQrvVvbohmUSOV07X9U`

⚠️ **Keep service role key secure** - Don't commit to git

### Environment Configuration

```env
# Frontend (.env.local)
VITE_SUPABASE_URL=https://ekswazmqhwtxzgdckpxt.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVrc3dhem1xaHd0eHpnZGNrcHh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyNDY2MzMsImV4cCI6MjA3NzgyMjYzM30.Y04J2jVcms5kRYcS15QZ8ATanQrvVvbohmUSOV07X9U
```

---

## Database Tables

### Core Tables

#### `users`
- Authentication profiles for clients and admins
- Fields: `id`, `email`, `full_name`, `business_name`, `role`, `created_at`, `updated_at`
- RLS: Users see own profile, admins see all

#### `orders`
- Client orders
- Fields: `id`, `client_id`, `order_number`, `status`, `total_price_incl_vat`, `admin_notes`, `calendar_slot_id`, `created_at`, `updated_at`
- Statuses: `in_review`, `confirmed`, `planned`, `delivered`, `completed`
- RLS: Clients see own orders, admins see all

#### `invoices`
- Invoice tracking and billing
- Fields: `id`, `order_id`, `invoice_number`, `issue_date`, `due_date`, `amount_excl_vat`, `vat_amount`, `amount_incl_vat`, `payment_status`, `pdf_path`, `pdf_uploaded_at`, `notes`, `created_by`, `created_at`, `updated_at`
- Payment Status: `unpaid`, `partial`, `paid`
- RLS: Clients see own invoices, admins see all

### Admin Infrastructure Tables

#### `calendar_slots`
- Global availability/blackout calendar
- Fields: `id`, `date`, `start_time`, `end_time`, `status`, `booked_by_order_id`, `created_at`, `updated_at`
- Status: `open`, `blackout`, `booked`
- RLS: Admins only

#### `admin_activity_log`
- Audit trail of admin actions
- Fields: `id`, `admin_id`, `action`, `target_table`, `target_id`, `old_values`, `new_values`, `ip_address`, `user_agent`, `created_at`, `metadata`
- RLS: Admins only

#### `admin_settings`
- System configuration
- Fields: `id`, `key`, `value`, `description`, `created_at`, `updated_at`
- RLS: Admins only

#### `email_notifications`
- Email tracking and history
- Fields: `id`, `recipient_email`, `recipient_name`, `email_type`, `subject`, `body`, `related_order_id`, `related_invoice_id`, `status`, `sent_at`, `error_message`, `created_at`, `updated_at`
- Types: `order_submitted`, `order_confirmed`, `order_planned`, `order_delivered`, `invoice_created`, `invoice_overdue`, `invoice_paid`
- Status: `pending`, `sent`, `failed`, `bounced`
- RLS: System can insert, admins can view/update

---

## Database Functions

### Order & Invoice Generation

#### `generate_order_number()`
- Returns: `TEXT` (e.g., "IM-000001")
- Usage: Called automatically when creating orders
- Atomic: Uses sequences to prevent duplicate numbers

#### `generate_invoice_number()`
- Returns: `TEXT` (e.g., "INV-2025-000001")
- Usage: Called automatically when creating invoices
- Year-scoped: Changes pattern each year

### Admin Operations

#### `log_admin_action()`
```sql
log_admin_action(
  admin_id: UUID,
  action: TEXT,
  target_table: TEXT,
  target_id: UUID,
  old_values: JSONB,
  new_values: JSONB
) → UUID
```
- Returns: ID of created log entry
- Usage: Audit trail for all admin operations

#### `log_email_notification()`
```sql
log_email_notification(
  recipient_email: TEXT,
  recipient_name: TEXT,
  email_type: TEXT,
  subject: TEXT,
  body: TEXT,
  order_id: UUID (optional),
  invoice_id: UUID (optional)
) → UUID
```
- Returns: ID of created notification record
- Usage: Track all emails sent by system

### Admin Helpers

#### `check_overdue_invoices()`
- Returns: Table of overdue invoices
- Usage: Identify invoices past due date

#### `available_orders_for_invoice` (View)
- Lists orders ready for invoice creation
- Automatically excludes orders with existing invoices

---

## Triggers

### `order_status_email_trigger`
- **Event:** UPDATE on `orders` table
- **When:** After order status changes
- **Action:** Logs email notification (doesn't send, just tracks intent)
- **Statuses Handled:**
  - `confirmed` → "Order Confirmed" email
  - `planned` → "Order Scheduled" email
  - `delivered` → "Order Delivered" email

---

## Row Level Security (RLS)

### Policy Strategy

All tables have RLS enabled with these principles:

1. **Users Table**
   - Users can view/update own profile
   - Admins can view/update all profiles
   - Uses `auth.uid()` comparison

2. **Orders Table**
   - Clients see only own orders
   - Admins see all orders
   - Admins can update any order

3. **Invoices Table**
   - Clients see invoices for their orders
   - Admins see all invoices
   - Admins can manage all invoices

4. **Admin Tables** (Calendar, Activity Log, Settings, Email Notifications)
   - Accessible only to admin role
   - System can insert email notifications

### Authentication

- **Role Source:** `users.role` column ('admin' or 'client')
- **User Context:** `auth.uid()` from JWT
- **Check Method:** `EXISTS` subquery for admin verification

---

## Sequences

### `order_number_seq`
- Starts at: 1
- Increments: 1
- Used by: `generate_order_number()`
- Format: `IM-000001`, `IM-000002`, etc.

### `invoice_number_seq`
- Starts at: 1
- Increments: 1
- Used by: `generate_invoice_number()`
- Format: `INV-2025-000001`, `INV-2025-000002`, etc.

---

## Indexes

### Performance Indexes

```sql
-- Users
idx_users_role                          -- On role for quick admin checks

-- Orders
idx_orders_status                       -- For status filtering
idx_orders_client_status               -- For client-specific status queries
idx_orders_calendar_slot_id            -- For calendar lookups

-- Invoices
idx_invoices_order_id                  -- For invoice lookups
idx_invoices_invoice_number            -- For unique invoice number queries
idx_invoices_payment_status            -- For payment status filtering
idx_invoices_created_at                -- For date range queries

-- Calendar
idx_calendar_slots_date                -- For date-based slot queries
idx_calendar_slots_status              -- For availability checks
idx_calendar_slots_booked_order        -- For booking lookups

-- Admin Activity
idx_admin_activity_log_admin_id        -- For user activity reports
idx_admin_activity_log_created_at      -- For audit trails
idx_admin_activity_log_action          -- For action filtering

-- Email Notifications
idx_email_notifications_status         -- For pending email checks
idx_email_notifications_type           -- For email type filtering
idx_email_notifications_order          -- For order-related emails
idx_email_notifications_invoice        -- For invoice-related emails
idx_email_notifications_created        -- For timestamp queries
```

---

## Application Integration

### Supabase Client Setup

```typescript
// src/integrations/supabase/client.ts
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### Common Operations

#### Query Orders
```typescript
const { data: orders } = await supabase
  .from('orders')
  .select('*')
  .eq('client_id', userId);
```

#### Create Invoice
```typescript
const { data: invoice } = await supabase
  .from('invoices')
  .insert({
    order_id: orderId,
    invoice_number: generateInvoiceNumber(), // Calls generate_invoice_number()
    due_date: new Date(),
    amount_excl_vat: amount,
    vat_amount: amount * 0.21,
    amount_incl_vat: amount * 1.21,
    created_by: adminUserId
  });
```

#### Get Admin Dashboard Data
```typescript
const { data: stats } = await supabase
  .from('orders')
  .select('status, count')
  .eq('status', 'confirmed');
```

---

## Migration Files Location

```
supabase/migrations/
├── 20251022041141_c8359f9d-763e-4e80-bb08-0ca78d8cecbe.sql
├── 20251022050000_fix_users_rls.sql
├── 20251023000000_create_order_number_function.sql
├── 20251101192740_fix_order_number_sequence.sql
├── 20251102000000_create_admin_infrastructure.sql
└── 20251102050000_phase6_email_notifications.sql
```

---

## Database Connection Details

### Direct Database Access (for admins)
```
Host: db.ekswazmqhwtxzgdckpxt.supabase.co
Port: 5432
Database: postgres
Username: postgres
Password: [from Supabase Dashboard]
```

### Using psql
```bash
psql "postgresql://postgres:password@db.ekswazmqhwtxzgdckpxt.supabase.co:5432/postgres"
```

---

## Monitoring & Maintenance

### Check Active Connections
```sql
SELECT usename, count(*) FROM pg_stat_activity GROUP BY usename;
```

### Monitor Query Performance
```sql
SELECT query, mean_time, calls FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;
```

### Database Size
```sql
SELECT pg_database.datname,
       pg_size_pretty(pg_database_size(pg_database.datname)) AS size
FROM pg_database
WHERE datname = 'postgres';
```

---

## Backup & Recovery

### Automated Backups
- Supabase provides daily backups automatically
- Backups retained for 7 days (free plan)
- Access via Supabase Dashboard → Settings → Backups

### Manual Backup
```bash
pg_dump "postgresql://postgres:password@db.ekswazmqhwtxzgdckpxt.supabase.co/postgres" > backup.sql
```

### Restore from Backup
```bash
psql "postgresql://postgres:password@db.ekswazmqhwtxzgdckpxt.supabase.co/postgres" < backup.sql
```

---

## Security Best Practices

1. **Never commit `.env.local` to git**
   - Add to `.gitignore`
   - Use `.env.local.example` instead

2. **Service Role Key** (if used)
   - Keep in backend environment only
   - Never expose to frontend

3. **RLS Policies**
   - Always enable RLS on production tables
   - Test policies thoroughly
   - Use `auth.uid()` for user context

4. **API Rate Limiting**
   - Monitor API usage in Supabase Dashboard
   - Implement client-side rate limiting

5. **Audit Trail**
   - Log all admin actions (automatic via trigger)
   - Review activity logs regularly

---

## Support & Resources

- **Supabase Dashboard:** https://app.supabase.com/
- **Documentation:** https://supabase.com/docs
- **Status Page:** https://status.supabase.com/
- **Community:** https://discord.supabase.io/

---

**Last Updated:** November 4, 2025  
**Database Version:** PostgreSQL 14+  
**Supabase Version:** Latest
