# Supabase Database Migration Guide

## Overview
You're migrating from your old Supabase project to a new project. This guide provides step-by-step instructions to migrate your entire database schema and data.

**Old Project ID:** `tvuklnrtagwivkcznedy`
**New Project URL:** `https://ekswazmqhwtxzgdckpxt.supabase.co`

---

## Option 1: Using Supabase CLI (Recommended)

### Prerequisites
1. Install Supabase CLI:
```bash
brew install supabase/tap/supabase
```

2. Verify installation:
```bash
supabase --version
```

### Step 1: Authentication
```bash
# Log in to Supabase
supabase login
# Follow the prompt to authenticate with your Supabase account
```

### Step 2: Link to New Project
```bash
# Change to your project directory
cd "/Users/kalanakavinda/Downloads/client portal"

# Unlink from old project (if linked)
supabase projects unlink

# Link to new project
supabase link --project-ref ekswazmqhwtxzgdckpxt
# When prompted for password, enter your Supabase project password
```

### Step 3: Push Migrations
```bash
# Push all local migrations to the new project
supabase db push
```

This command will:
- Apply all migrations from `supabase/migrations/` folder
- Create all tables, functions, triggers, and policies
- Set up sequences and indexes

### Step 4: Migrate Data (if needed)
If you have existing data in the old project, you can export and import it:

```bash
# Export data from old project
supabase db dump --project-ref tvuklnrtagwivkcznedy > old_data.sql

# Import data to new project
supabase db push --db-url "postgresql://postgres:[password]@db.ekswazmqhwtxzgdckpxt.supabase.co:5432/postgres"
```

---

## Option 2: Manual Migration Using SQL

### Step 1: Get Database Credentials for New Project
1. Go to https://app.supabase.com/
2. Select your new project (ekswazmqhwtxzgdckpxt)
3. Navigate to **Settings → Database**
4. Copy the connection string or use the default database URL

### Step 2: Connect to New Database
Using pgAdmin or any PostgreSQL client:
```
Host: db.ekswazmqhwtxzgdckpxt.supabase.co
Port: 5432
Database: postgres
Username: postgres
Password: [your-database-password]
```

### Step 3: Run All Migrations in Order
Execute these migrations in the new project database in this exact order:

1. **20251022041141_c8359f9d-763e-4e80-bb08-0ca78d8cecbe.sql** - Initial setup with RLS
2. **20251022050000_fix_users_rls.sql** - Fix RLS policies
3. **20251023000000_create_order_number_function.sql** - Order/Invoice number generators
4. **20251101192740_fix_order_number_sequence.sql** - Sequence-based numbering
5. **20251102000000_create_admin_infrastructure.sql** - Admin panel tables
6. **20251102050000_phase6_email_notifications.sql** - Email tracking system

You can:
- Copy each SQL file and run in Supabase SQL Editor
- Or use psql from terminal: `psql -h db.ekswazmqhwtxzgdckpxt.supabase.co -U postgres -d postgres -f migration.sql`

---

## Step 4: Update Your Application Configuration

### Update Environment Variables
Edit your `.env.local` or `.env` file:

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

## Step 5: Test the Connection

### Test via Terminal
```bash
cd "/Users/kalanakavinda/Downloads/client portal"

# Test connection
curl -X GET "https://ekswazmqhwtxzgdckpxt.supabase.co/rest/v1/users" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVrc3dhem1xaHd0eHpnZGNrcHh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyNDY2MzMsImV4cCI6MjA3NzgyMjYzM30.Y04J2jVcms5kRYcS15QZ8ATanQrvVvbohmUSOV07X9U"
```

### Test via Application
```bash
npm run dev
# Test login and data fetching
```

---

## Step 6: Verify Data (if migrating data)

### Check Tables
```sql
-- Connect to new project and run:
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
```

You should see:
- `users`
- `orders`
- `invoices`
- `calendar_slots`
- `admin_activity_log`
- `admin_settings`
- `email_notifications`

### Check Functions and Triggers
```sql
SELECT routine_name FROM information_schema.routines WHERE routine_schema = 'public';
SELECT trigger_name FROM information_schema.triggers WHERE trigger_schema = 'public';
```

---

## Step 7: Deploy to Production

Once verified:

1. **Update all deployment configurations** (if any) with new credentials
2. **Rebuild and test**: `npm run build`
3. **Deploy**: Follow your deployment process
4. **Monitor**: Watch for any connection errors in logs

---

## Verification Checklist

- [ ] All migrations executed successfully
- [ ] Tables created in new project
- [ ] RLS policies active
- [ ] Functions and triggers created
- [ ] Application connects to new database
- [ ] Login works
- [ ] Can view orders/invoices
- [ ] Can create new orders
- [ ] Admin panel functional
- [ ] Email notifications table exists

---

## Troubleshooting

### Issue: Connection Refused
**Solution:** Check that the project URL and API key are correct and the database is running.

### Issue: RLS Policy Violations
**Solution:** Ensure all migrations ran in the correct order. Run migration #4 or #5 to fix RLS issues.

### Issue: "Function does not exist"
**Solution:** Run migrations 20251023000000 and 20251101192740 to create number generation functions.

### Issue: Missing Admin Tables
**Solution:** Run migration 20251102000000_create_admin_infrastructure.sql

---

## Rolling Back (if needed)

If you need to keep using the old project temporarily:
1. Revert the config.toml to old project ID: `tvuklnrtagwivkzczedy`
2. Restore old API keys in environment variables
3. Restart the application

---

## Support

For Supabase-specific issues:
- https://supabase.com/docs
- https://supabase.com/docs/guides/cli
- Supabase Dashboard: https://app.supabase.com/
