# 📋 Deployment Checklist

Complete step-by-step deployment guide for Admin Panel.

---

## 🎯 Pre-Deployment (Must Complete)

### Step 1: Testing ✅
- [ ] Read QUICK_TEST_SCRIPT.md
- [ ] Run 30-minute quick test
- [ ] All tests passed
- [ ] No console errors
- [ ] Build completes successfully

### Step 2: Code Review ✅
- [ ] Review all Phase 6 components
- [ ] Check database migrations
- [ ] Verify RLS policies
- [ ] Confirm no hardcoded credentials
- [ ] Check environment variables

### Step 3: Database Backup ✅
```bash
# In Supabase Dashboard:
1. Go to Settings → Backups
2. Create manual backup
3. Wait for completion
4. Save backup ID
```

### Step 4: Environment Setup ✅
```
Create .env.production with:
VITE_SUPABASE_URL=production_url
VITE_SUPABASE_ANON_KEY=production_key
```

---

## 🚀 Deployment Steps

### Step 1: Database Migrations (5 min)
```sql
-- 1. Go to Supabase → SQL Editor
-- 2. Run each migration in order:

-- Migration 1: Fix order number sequence
-- File: supabase/migrations/20251101192740_fix_order_number_sequence.sql
[Copy-paste entire migration]

-- Migration 2: Create admin infrastructure
-- File: supabase/migrations/20251102000000_create_admin_infrastructure.sql
[Copy-paste entire migration]

-- Migration 3: Email notifications
-- File: supabase/migrations/20251102050000_phase6_email_notifications.sql
[Copy-paste entire migration]

-- 3. Verify migrations ran:
SELECT * FROM pg_stat_database WHERE datname = 'postgres';
```

### Step 2: Verify Database ✅
```sql
-- Verify all tables created:
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name IN (
  'orders', 'invoices', 'calendar_slots', 
  'admin_activity_log', 'email_notifications', 'users'
);

-- Expected output: 6 rows

-- Verify functions created:
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public';

-- Expected: generate_order_number, generate_invoice_number, etc.

-- Verify triggers:
SELECT trigger_name FROM information_schema.triggers;

-- Expected: order_status_email_trigger
```

### Step 3: Build & Optimize (3 min)
```bash
# Clean previous build
rm -rf dist

# Production build
npm run build

# Verify build
ls -la dist/
# Should show:
# - index.html (2+ KB)
# - assets/index.css (70+ KB)
# - assets/index.js (1000+ KB)
```

### Step 4: Storage Configuration ✅
```
In Supabase:
1. Go to Storage → Buckets
2. Create bucket named "invoices"
3. Set policy: Public (read), Authenticated (write)
4. Create folder structure: /invoices/

SQL to verify:
SELECT * FROM storage.buckets;
```

### Step 5: RLS Policies Verification ✅
```sql
-- Check all RLS policies enabled:
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
  'calendar_slots', 'admin_activity_log', 
  'admin_settings', 'invoices', 'email_notifications'
);

-- For each table, verify:
SELECT * FROM information_schema.table_constraints 
WHERE constraint_type = 'CHECK';
```

### Step 6: Deploy Frontend

#### Option A: Vercel (Recommended)
```bash
# 1. Connect GitHub repo to Vercel
# 2. Set environment variables in Vercel dashboard
# 3. Deploy:
npm run build
vercel

# 4. Verify deployment
# Visit: https://your-domain.vercel.app/admin
```

#### Option B: Netlify
```bash
# 1. Install Netlify CLI
npm install -g netlify-cli

# 2. Build
npm run build

# 3. Deploy
netlify deploy --prod --dir=dist
```

#### Option C: Docker / Self-Hosted
```bash
# 1. Build
npm run build

# 2. Copy dist/ to server
scp -r dist/* user@server:/var/www/html/

# 3. Configure nginx/apache
# Document root: /var/www/html

# 4. Restart web server
sudo systemctl restart nginx
```

---

## ✅ Post-Deployment (Verification)

### Step 1: Smoke Tests (5 min)
```
1. Visit https://your-domain/admin
2. Redirect to /auth expected
3. Log in with admin account
4. Navigate to /admin/dashboard
   Expected: Statistics load
5. Go to /admin/orders
   Expected: Orders display
6. Go to /admin/invoices
   Expected: Invoices display
7. Go to /admin/calendar
   Expected: Calendar displays
```

### Step 2: Error Monitoring ✅
```
Set up error tracking:
- Sentry.io
- LogRocket
- Datadog

Configure in main.tsx:
```

### Step 3: Email Service Setup ✅
```
1. Choose provider:
   - SendGrid
   - Mailgun
   - AWS SES
   - Resend

2. Get API key

3. Create email sending function in Supabase Edge Functions:
   - Deploy: supabase functions deploy send-email
   - Test: curl -X POST http://localhost:54321/functions/v1/send-email

4. Update email triggers to call function
```

### Step 4: Monitor Logs ✅
```
In Supabase:
1. Go to Logs → Functions
2. Check for errors
3. Go to Logs → Database
4. Check for RLS violations
5. Go to Storage → Activity
6. Verify PDF uploads working
```

---

## 🔍 Health Checks

### Daily Health Checks
```sql
-- Check for errors in logs:
SELECT COUNT(*) as error_count FROM admin_activity_log 
WHERE created_at > NOW() - INTERVAL '24 hours';

-- Check email notifications queued:
SELECT COUNT(*) FROM email_notifications 
WHERE status = 'pending';

-- Check for failed email attempts:
SELECT COUNT(*) FROM email_notifications 
WHERE status = 'failed';

-- Check database connections:
SELECT * FROM pg_stat_activity WHERE state != 'idle';
```

### Weekly Health Checks
```sql
-- Order trends:
SELECT COUNT(*) FROM orders 
WHERE created_at > NOW() - INTERVAL '7 days';

-- Invoice creation:
SELECT COUNT(*) FROM invoices 
WHERE created_at > NOW() - INTERVAL '7 days';

-- Admin activity trends:
SELECT action, COUNT(*) as count FROM admin_activity_log 
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY action;
```

---

## 🚨 Rollback Plan

If something goes wrong:

### Option 1: Revert Frontend
```bash
# Using Vercel:
1. Go to Deployments
2. Find previous working version
3. Click "Promote to Production"

# Using Netlify:
1. Go to Deploys
2. Find previous version
3. Click "Publish deploy"

# Using Docker:
1. Switch back to previous image version
2. Restart container
```

### Option 2: Database Rollback
```bash
# Using Supabase:
1. Go to Settings → Backups
2. Select pre-deployment backup
3. Click "Restore"
4. Wait for completion
```

### Option 3: Disable Admin Panel
```sql
-- Temporarily disable admin routes:
-- In Supabase RLS, drop admin-related policies
-- Users redirected to /dashboard

-- When fixed, restore policies
```

---

## 📊 Performance Monitoring

### Set up monitoring alerts:

**Metric 1: Page Load Time**
- Alert if > 3 seconds
- Tool: Vercel Analytics or Sentry

**Metric 2: Database Queries**
- Alert if slow queries > 1s
- Tool: Supabase Dashboard

**Metric 3: API Response Time**
- Alert if > 500ms
- Tool: CloudFlare or similar

**Metric 4: Error Rate**
- Alert if error rate > 1%
- Tool: Sentry.io

---

## 📧 Email Configuration

### Example: SendGrid Setup

```javascript
// supabase/functions/send-email/index.ts
import { createClient } from '@supabase/supabase-js'

export async function sendEmail(
  to: string,
  subject: string,
  body: string
) {
  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${Deno.env.get('SENDGRID_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: { email: 'noreply@immoaura.com' },
      subject,
      content: [{ type: 'text/html', value: body }],
    }),
  })
  
  return response.json()
}
```

---

## 🔒 Security Checklist

Before going live:

- [ ] Remove all console.log() statements
- [ ] Remove all TODO comments
- [ ] Check for hardcoded credentials
- [ ] Verify CORS settings
- [ ] Test SQL injection prevention
- [ ] Verify RLS policies comprehensive
- [ ] Check password strength requirements
- [ ] Verify HTTPS enabled
- [ ] Set security headers
- [ ] Enable rate limiting

---

## 📞 Post-Deployment Support

### Monitor these resources:
1. **Supabase Dashboard** - Database & API health
2. **Error Tracking** - Sentry or similar
3. **Email Logs** - SendGrid/Mailgun dashboard
4. **Server Logs** - Application errors

### Create runbook for:
1. How to scale database
2. How to investigate errors
3. How to rollback if needed
4. How to update code

---

## ✨ Celebration

Once deployed and verified:

```
🎉 ADMIN PANEL LIVE IN PRODUCTION! 🎉

Features live:
✅ Order management
✅ Calendar management
✅ Invoice management
✅ Email notifications
✅ Audit logging
✅ Full admin dashboard

Monitor for:
- User feedback
- Performance issues
- Error rates
- Email delivery rates

Update docs:
- Internal wiki
- Client documentation
- Support documentation

Schedule:
- Weekly retrospective
- Performance review
- Feature roadmap
```

---

**Deployment complete! Enjoy your production Admin Panel! 🚀**
