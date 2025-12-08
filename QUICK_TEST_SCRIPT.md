# ⚡ Quick Test Script - 30 Minute Validation

Fast-track testing to validate all core features in ~30 minutes.

---

## 🎯 Pre-Test Setup (5 minutes)

```bash
# 1. Start dev server
npm run dev

# 2. Open in browser
# http://localhost:5173

# 3. Open Supabase dashboard in another tab
# Your project → SQL Editor

# 4. Create test admin account
# Go to Supabase → Authentication → Add User
# Email: admin@test.com
# Password: Test1234!

# 5. Set admin role in users table
SELECT * FROM users WHERE email = 'admin@test.com';
UPDATE users SET role = 'admin' WHERE email = 'admin@test.com';
```

---

## 🏃 30-Minute Test Plan

### ✅ TEST 1: Authentication (2 min)
```
1. Log out if logged in
2. Go to http://localhost:5173/admin
   Expected: Redirects to /auth
3. Log in as admin@test.com / Test1234!
4. Go to http://localhost:5173/admin/dashboard
   Expected: Loads successfully
5. Check DevTools Console
   Expected: No errors
```

### ✅ TEST 2: Dashboard (2 min)
```
1. On /admin/dashboard
2. Scroll and verify visible:
   ☐ 4 stat cards (Orders, Invoices, Month, Revenue)
   ☐ Recent Orders list
   ☐ Quick action buttons
3. Click "View Orders"
   Expected: Takes to /admin/orders
```

### ✅ TEST 3: Orders Management (5 min)
```
1. On /admin/orders page
2. Verify table displays:
   ☐ Order numbers
   ☐ Client names
   ☐ Status badges
   ☐ Amounts
3. Test search: type "IM" in search
   Expected: Filters to matching orders
4. Click "View" on any order
   Expected: Right panel opens
5. Verify in panel:
   ☐ Order details visible
   ☐ Status dropdown works
   ☐ Can type admin notes
6. Update status: in_review → confirmed
   Expected: Toast notification appears
7. Close panel (X button)
   Expected: Panel closes smoothly
```

### ✅ TEST 4: Calendar (5 min)
```
1. Go to /admin/calendar
2. Verify:
   ☐ 12-month calendar displays
   ☐ Current month highlighted
   ☐ Navigation arrows work
3. Click on December date
4. Verify in modal:
   ☐ Can create slots (09:00-13:00, 14:00-18:00)
   ☐ Date turns green after creating
5. Click again to see time slots
6. Test bulk actions:
   ☐ "Copy Month" (Dec → Jan)
   ☐ Navigate to January
   Expected: Pattern matches December
```

### ✅ TEST 5: Invoices (8 min)
```
1. Go to /admin/invoices
2. Verify table displays with columns:
   ☐ Invoice #
   ☐ Order #
   ☐ Client
   ☐ Amount
   ☐ Status
3. Click "+ New Invoice" button
   Expected: Modal opens
4. In modal:
   ☐ Select order from dropdown
   ☐ Dates auto-fill (today + 14 days)
   ☐ Amounts pre-fill and calculate VAT
   ☐ Click "Create Invoice"
   Expected: Toast "Invoice created successfully!"
5. Find new invoice in table
6. Click "View" on invoice
   Expected: Right panel opens
7. Verify in panel:
   ☐ Invoice details visible
   ☐ Payment status dropdown works
   ☐ PDF section shows
8. Test payment status: unpaid → partial
   Expected: Toast notification, color changes
9. Test payment status: partial → paid
   Expected: Toast with auto-complete message (if order is delivered)
```

### ✅ TEST 6: Database & Email (3 min)
```
1. Go to Supabase SQL Editor
2. Run: SELECT COUNT(*) FROM admin_activity_log;
   Expected: Shows count > 0 (from our actions)
3. Run: SELECT COUNT(*) FROM email_notifications;
   Expected: Shows count > 0
4. View the most recent email:
   SELECT * FROM email_notifications 
   ORDER BY created_at DESC LIMIT 1;
   Expected: Shows email_type, subject, status
```

### ✅ TEST 7: Build & Performance (3 min)
```
1. Stop dev server (Ctrl+C)
2. Run: npm run build
   Expected: Build completes with "✓ built in Xs"
3. Check build size output
   Expected: No major warnings about missing modules
4. Check dist/ folder exists
   Expected: dist/ has index.html and assets/
```

---

## 🎯 Quick Test Summary

Below is a checklist. Mark each as you complete:

```
CRITICAL FEATURES ✅
☐ Admin can access /admin/dashboard
☐ Dashboard shows statistics
☐ Orders list displays
☐ Can update order status
☐ Calendar displays 12 months
☐ Can create calendar slots
☐ Invoices list displays
☐ Can create invoice
☐ Can update payment status
☐ Build completes successfully

DATABASE ✅
☐ admin_activity_log has entries
☐ email_notifications has entries
☐ All tables accessible

SECURITY ✅
☐ Non-admin cannot access /admin
☐ Admin-only routes protected

ERRORS ✅
☐ No console errors
☐ No TypeScript errors
☐ No build errors
```

---

## 🚀 If All Tests Pass

Congratulations! You're ready for:

1. **Deploy to Production**
   ```bash
   npm run build
   # Deploy dist/ folder to your host
   ```

2. **Database Migrations**
   ```sql
   -- In Supabase SQL Editor, run:
   -- All migrations from supabase/migrations/
   ```

3. **Configure Email Service**
   - Set up SendGrid/Mailgun API key
   - Update email functions in Supabase

4. **Monitor**
   - Track admin_activity_log
   - Monitor email_notifications
   - Check error logs

---

## ⚠️ If Tests Fail

Common issues and solutions:

### Issue: Cannot access /admin
**Solution:** 
- Check: `role` column in users table
- Ensure: `role = 'admin'` for your user
- Restart: Browser (clear cache)

### Issue: Orders don't display
**Solution:**
- Create test orders in client portal first
- Refresh orders page
- Check browser DevTools Network tab

### Issue: Calendar not displaying
**Solution:**
- Check: calendar_slots table exists in Supabase
- Verify: RLS policies enabled
- Run migration: `20251102000000_create_admin_infrastructure.sql`

### Issue: Build fails
**Solution:**
- Clear node_modules: `rm -rf node_modules && npm install`
- Check for TypeScript errors: `npm run build`
- View full error output

### Issue: Database migrations not applied
**Solution:**
- Go to Supabase → SQL Editor
- Copy-paste entire migration file
- Run each migration in order

---

## 📊 Test Data Setup (Optional)

If you need test data:

```sql
-- Create 3 test orders
INSERT INTO orders (client_id, order_number, status, total_price_excl_vat, total_price_incl_vat)
SELECT id, 'IM-TEST-' || FLOOR(RANDOM()*10000), 'in_review', 1000, 1210
FROM users WHERE role = 'client'
LIMIT 3;

-- Create 2 test invoices
INSERT INTO invoices (order_id, invoice_number, issue_date, due_date, amount_excl_vat, vat_amount, amount_incl_vat, payment_status, created_by)
SELECT id, 'INV-2025-' || LPAD(FLOOR(RANDOM()*100000)::TEXT, 6, '0'), 
  CURRENT_DATE - INTERVAL '5 days',
  CURRENT_DATE + INTERVAL '9 days',
  1000, 210, 1210, 'unpaid', 
  (SELECT id FROM users WHERE role = 'admin' LIMIT 1)
FROM orders LIMIT 2;

-- Create calendar slots for December
INSERT INTO calendar_slots (date, start_time, end_time, status)
WITH RECURSIVE dates AS (
  SELECT DATE '2025-12-01' as date
  UNION ALL
  SELECT date + INTERVAL '1 day'
  FROM dates
  WHERE date < '2025-12-31'
)
SELECT date, '09:00'::TIME, '13:00'::TIME, 'open' FROM dates;
```

---

## ✅ Final Checklist Before Deploy

- [ ] All 7 tests passed
- [ ] No console errors
- [ ] Build completes without errors
- [ ] Database tables verified
- [ ] RLS policies working
- [ ] Email notifications logging
- [ ] Audit logging working
- [ ] Performance acceptable (<3s page load)

---

**Once all tests pass, you're ready to deploy! 🚀**

Need help? Check TESTING_GUIDE.md for detailed tests.
