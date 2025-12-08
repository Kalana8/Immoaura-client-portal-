# Supabase Database Migration - Summary

## 🎯 Quick Start (Automated)

### Easiest Method: Run the Migration Script

```bash
cd "/Users/kalanakavinda/Downloads/client portal"
./migrate-to-new-project.sh
```

This script will:
1. ✅ Check prerequisites (Supabase CLI)
2. ✅ Update configuration files
3. ✅ Link to your new project
4. ✅ Push all migrations automatically
5. ✅ Update environment variables
6. ✅ Test the connection
7. ✅ Create backup files for rollback

---

## 📋 Migration Details

### What You're Migrating

**Old Project:** `tvuklnrtagwivkzczedy`  
**New Project:** `ekswazmqhwtxzgdckpxt`  
**New URL:** `https://ekswazmqhwtxzgdckpxt.supabase.co`

### Database Schema

Your migration includes 6 migration files:

1. **20251022041141** - Initial RLS setup (Users, Orders, basic tables)
2. **20251022050000** - Fix RLS policies (prevent infinite recursion)
3. **20251023000000** - Order/Invoice number generators
4. **20251101192740** - Sequence-based atomic numbering
5. **20251102000000** - Admin infrastructure (Calendar, Activity Log, Settings, Invoices)
6. **20251102050000** - Email notifications system

### Tables Being Created

- `users` - User profiles and admin roles
- `orders` - Client orders
- `invoices` - Invoice tracking
- `calendar_slots` - Admin calendar management
- `admin_activity_log` - Audit trail
- `admin_settings` - Configuration
- `email_notifications` - Email tracking

### Functions & Triggers

- `generate_order_number()` - Auto-generates IM-000001 format
- `generate_invoice_number()` - Auto-generates INV-YYYY-000001 format
- `log_email_notification()` - Tracks email sends
- `log_admin_action()` - Audit logging
- `trigger_order_status_email()` - Auto-email on order updates
- `check_overdue_invoices()` - Finds overdue invoices

---

## ⚡ Three Ways to Migrate

### Method 1: Automated Script (Recommended) ⭐

```bash
./migrate-to-new-project.sh
```

**Pros:**
- Fully automated
- Error checking
- Creates backups
- Tests connection
- Updates all files

**Time:** 2-3 minutes

---

### Method 2: Supabase CLI (Manual)

```bash
# 1. Install CLI
brew install supabase/tap/supabase

# 2. Login
supabase login

# 3. Link to new project
supabase link --project-ref ekswazmqhwtxzgdckpxt

# 4. Push migrations
supabase db push

# 5. Update config
# Edit supabase/config.toml: change project_id to "ekswazmqhwtxzgdckpxt"
# Edit .env.local with new credentials (see below)
```

**Pros:**
- More control
- Transparent process
- Supabase-official method

**Time:** 5-10 minutes

---

### Method 3: Supabase Dashboard (Manual)

```bash
# 1. Go to https://app.supabase.com/
# 2. Select new project (ekswazmqhwtxzgdckpxt)
# 3. Open SQL Editor
# 4. Copy each migration file content
# 5. Run each migration in order (6 migrations total)
# 6. Update configuration manually
```

**Pros:**
- No CLI needed
- Visual feedback
- Good for learning

**Cons:**
- Manual process
- Slower
- Error-prone

**Time:** 15-20 minutes

---

## 🔧 Configuration Update

### Update Environment Variables

Create or update `.env.local`:

```env
VITE_SUPABASE_URL=https://ekswazmqhwtxzgdckpxt.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVrc3dhem1xaHd0eHpnZGNrcHh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyNDY2MzMsImV4cCI6MjA3NzgyMjYzM30.Y04J2jVcms5kRYcS15QZ8ATanQrvVvbohmUSOV07X9U
```

### Update Supabase Config

Edit `supabase/config.toml`:

```toml
project_id = "ekswazmqhwtxzgdckpxt"
```

---

## ✅ Verification Steps

After migration completes:

### 1. Test Connection
```bash
curl -X GET "https://ekswazmqhwtxzgdckpxt.supabase.co/rest/v1/users?limit=1" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVrc3dhem1xaHd0eHpnZGNrcHh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyNDY2MzMsImV4cCI6MjA3NzgyMjYzM30.Y04J2jVcms5kRYcS15QZ8ATanQrvVvbohmUSOV07X9U"
```

### 2. Check Tables in New Project
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' ORDER BY table_name;
```

Expected tables: `users`, `orders`, `invoices`, `calendar_slots`, `admin_activity_log`, `admin_settings`, `email_notifications`

### 3. Test Application
```bash
npm install
npm run dev
# Try logging in and creating an order
```

### 4. Verify Admin Panel
```
http://localhost:5173/admin
# Check calendar, messages, settings, orders tabs
```

---

## 🔄 Data Migration (Optional)

If you have existing data in the old project:

### Export from Old Project
```bash
supabase db dump --project-ref tvuklnrtagwivkczedy > backup.sql
```

### Import to New Project
```bash
psql -h db.ekswazmqhwtxzgdckpxt.supabase.co \
     -U postgres \
     -d postgres \
     -f backup.sql
```

**Note:** Only raw data migrations (no schema). Schema is handled by migrations.

---

## ⚠️ Troubleshooting

### Connection Failed
```
Error: Failed to connect to database
```

**Solution:**
1. Check the project is running in Supabase Dashboard
2. Verify API key is correct
3. Check network connection
4. Verify database password

### Function Not Found
```
Error: function generate_order_number() does not exist
```

**Solution:** Run migration `20251101192740_fix_order_number_sequence.sql`

### RLS Policy Violations
```
Error: new row violates row-level security policy
```

**Solution:** 
1. Re-run migration `20251022050000_fix_users_rls.sql`
2. Check that migrations ran in correct order

### Admin Tables Missing
```
Error: relation "calendar_slots" does not exist
```

**Solution:** Run migration `20251102000000_create_admin_infrastructure.sql`

---

## 🔙 Rollback Instructions

If you need to revert to the old project:

```bash
./rollback-migration.sh
```

This will:
1. Restore `supabase/config.toml` from backup
2. Restore `.env.local` from backup
3. Update application to use old project

**Important:** The new project data remains on the server. To completely remove it:
1. Go to https://app.supabase.com/
2. Select the new project
3. Go to Settings → Delete Project

---

## 📊 Migration Checklist

Run through this after migration:

- [ ] Scripts executed without errors
- [ ] Backup files created (`config.toml.backup`, `.env.local.backup`)
- [ ] `supabase/config.toml` updated to new project ID
- [ ] `.env.local` contains new credentials
- [ ] All 6 migrations applied successfully
- [ ] Connection test passes
- [ ] `npm run dev` starts successfully
- [ ] Can login to application
- [ ] Can view orders/invoices
- [ ] Can create new order
- [ ] Admin panel accessible
- [ ] Calendar, Messages, Settings tabs work
- [ ] Email notifications table exists

---

## 📞 Support Resources

- **Supabase Documentation:** https://supabase.com/docs
- **Supabase CLI Guide:** https://supabase.com/docs/guides/cli
- **Database Migrations:** https://supabase.com/docs/guides/migrations
- **Your Supabase Dashboard:** https://app.supabase.com/

---

## 🚀 After Successful Migration

### Update Remote Deployments

If deployed:
1. Update Vercel/Netlify environment variables
2. Update any CI/CD deployment configurations
3. Redeploy application

### Commit Changes

```bash
git add supabase/config.toml .env.local
git commit -m "Migrate database to new Supabase project"
git push
```

### Clean Up Old Backups

```bash
rm supabase/config.toml.backup
rm .env.local.backup
```

---

**Migration Created:** November 4, 2025  
**Total Migration Files:** 6  
**Estimated Time:** 2-3 minutes (automated) | 5-20 minutes (manual)
