# 🧪 Admin Panel Testing Guide

Complete testing checklist for all 6 phases of the Admin Panel before deployment.

---

## 📋 Prerequisites

Before testing, ensure you have:

```bash
# 1. Dependencies installed
npm install

# 2. Environment variables set in .env.local
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key

# 3. Database migrations applied
# Go to Supabase dashboard → SQL Editor
# Run all migrations from supabase/migrations/ folder

# 4. Dev server running
npm run dev
# Open http://localhost:5173
```

---

## 🏗️ PHASE 1: Foundation & Authentication Testing

### Test 1.1: Admin Route Protection
```
Steps:
1. Log out or open incognito window
2. Try to access http://localhost:5173/admin
3. Should redirect to /auth
4. Log in with non-admin account
5. Try to access /admin again
6. Should redirect to /dashboard

Expected: ✅ Only admins can access /admin routes
```

### Test 1.2: Admin Authentication
```
Steps:
1. Create admin user in Supabase:
   - Go to Supabase → Authentication → Users
   - Create user with test@admin.com / password123
   - In users table, set role = 'admin'

2. Log in with admin credentials
3. Navigate to http://localhost:5173/admin/dashboard
4. Should load successfully
5. Check browser console for any errors

Expected: ✅ Admin dashboard loads without errors
```

### Test 1.3: Role Checking
```
Steps:
1. Log in as admin
2. Open browser DevTools → Network tab
3. Go to /admin/dashboard
4. Should see successful queries to users table
5. Check that role is correctly identified

Expected: ✅ useAdminAuth hook correctly identifies admin role
```

---

## 📊 PHASE 2: Dashboard Testing

### Test 2.1: Dashboard Statistics
```
Steps:
1. Log in as admin
2. Go to /admin/dashboard
3. Verify 4 info cards display:
   - Total Orders
   - Total Invoices
   - Orders This Month
   - Revenue (All Time)

4. Create a test order in client portal
5. Wait 2-3 seconds
6. Refresh dashboard
7. "Total Orders" should increment

Expected: ✅ Statistics update in real-time after order creation
```

### Test 2.2: Recent Orders Widget
```
Steps:
1. On dashboard, scroll to "Recent Orders"
2. Should show 5 most recent orders
3. Each should display:
   - Order number (IM-XXXXX)
   - Client name
   - Status badge
   - Amount

Expected: ✅ Orders display correctly with proper formatting
```

### Test 2.3: Quick Action Cards
```
Steps:
1. On dashboard, look for action cards
2. Each should be clickable
3. "View Orders" → takes to /admin/orders
4. "View Invoices" → takes to /admin/invoices
5. "Manage Calendar" → takes to /admin/calendar

Expected: ✅ All navigation links work correctly
```

---

## 📦 PHASE 3: Orders Management Testing

### Test 3.1: Orders Listing
```
Steps:
1. Go to /admin/orders
2. Should display table with columns:
   - Order #
   - Client
   - Status
   - Amount
   - Date
   - Action

3. Verify 3+ test orders display
4. Check loading state on page load
5. Verify no console errors

Expected: ✅ Orders table loads and displays correctly
```

### Test 3.2: Search Functionality
```
Steps:
1. In Orders table, use search box
2. Search by order number: "IM-001"
   - Only matching orders display
3. Search by client name: "John"
   - Only John's orders display
4. Clear search: all orders return
5. Search non-existent: "ZZZZZ"
   - No results message shows

Expected: ✅ Search filters orders correctly
```

### Test 3.3: Filter by Status
```
Steps:
1. Click "Filter by status" dropdown
2. Select "In Review"
   - Only in_review orders display
3. Select "Confirmed"
   - Only confirmed orders display
4. Select "All Status"
   - All orders return

Expected: ✅ Status filter works correctly
```

### Test 3.4: Order Detail Panel
```
Steps:
1. Click "View" button on any order
2. Right-side panel opens with:
   - Order number & status
   - Client info (name, email)
   - Order dates
   - Total amount breakdown
   - Status change dropdown
   - Admin notes section
   - Related invoices (if any)

3. Close panel (X button)
4. Panel should close smoothly

Expected: ✅ Detail panel displays all information correctly
```

### Test 3.5: Status Workflow
```
Steps:
1. Open order detail panel
2. Current status: "In Review"
3. Click status dropdown
4. Options should be: Confirmed, Cancelled (only from In Review)
5. Select "Confirmed"
6. Status updates immediately
7. Toast notification appears: "Order status updated"
8. Check admin_activity_log was created (in Supabase)

Expected: ✅ Status workflow enforces correct transitions
```

### Test 3.6: Admin Notes
```
Steps:
1. Open order detail panel
2. Scroll to Admin Notes section
3. Type: "Test note for this order"
4. Click "Save Notes"
5. Toast: "Notes saved successfully"
6. Close and reopen panel
7. Note should persist

Expected: ✅ Admin notes save and persist correctly
```

### Test 3.7: Calendar Slot Assignment
```
Steps:
1. Create order with status: "Planned"
2. Open order detail panel
3. Click "Assign Calendar Slot"
4. Modal opens showing available slots
5. Select a slot
6. Click "Assign"
7. Toast: "Slot assigned successfully"
8. Check calendar_slot_id in orders table

Expected: ✅ Calendar slot assignment works
```

---

## 📅 PHASE 4: Calendar Manager Testing

### Test 4.1: Calendar Display
```
Steps:
1. Go to /admin/calendar
2. Should show 12-month calendar view (3x4 grid)
3. Current month highlighted
4. Navigate with Previous/Next buttons
5. Each date shows color-coded status:
   - Green: open slots
   - Red: blackout
   - Yellow: booked
   - Gray: no slots

Expected: ✅ Calendar displays all 12 months correctly
```

### Test 4.2: Slot Management
```
Steps:
1. Click on a date with no slots
2. "Create Slots" button appears
3. Click to create (09:00-13:00 and 14:00-18:00)
4. Date turns green
5. Click date again
6. Shows both time slots
7. Toggle to blackout: turns red
8. Toggle back to open: turns green

Expected: ✅ Slot creation and toggling works
```

### Test 4.3: Bulk Actions - Repeat Weekly
```
Steps:
1. Set up December with specific pattern
2. In Bulk Actions panel, click "Repeat Weekly Pattern"
3. Confirm action
4. Toast: "Pattern applied to 52 weeks"
5. Check January-November
6. Pattern should repeat weekly

Expected: ✅ Weekly pattern repeats across 12 months
```

### Test 4.4: Bulk Actions - Copy Month
```
Steps:
1. Perfect December (all dates green)
2. Bulk Actions → "Copy Month"
3. Select "January" from dropdown
4. Click "Copy"
5. Go to January
6. Should match December exactly

Expected: ✅ Month copy works correctly
```

### Test 4.5: Bulk Actions - Clear Month
```
Steps:
1. Go to February
2. Click "Clear Month"
3. Confirm
4. All February slots disappear (gray)
5. Other months unaffected

Expected: ✅ Clear month removes all slots
```

### Test 4.6: Bulk Actions - Blackout All
```
Steps:
1. Go to March
2. Click "Blackout All"
3. Confirm
4. All March dates turn red
5. Calendar slots status = 'blackout'

Expected: ✅ Blackout makes all dates unavailable
```

### Test 4.7: Past Date Prevention
```
Steps:
1. Try to click on date from past month
2. Should show message: "Cannot modify past dates"
3. No changes allowed
4. Or: dates should be disabled (grayed out)

Expected: ✅ Past dates cannot be modified
```

### Test 4.8: Booked Slot Locking
```
Steps:
1. Create order and assign calendar slot
2. Go to calendar, find that date
3. Slot shows as Yellow (booked)
4. Try to click to toggle
5. Should show message: "Cannot modify booked slot"
6. Or: button should be disabled

Expected: ✅ Booked slots cannot be modified
```

---

## 💳 PHASE 5: Invoices Testing

### Test 5.1: Invoice Listing
```
Steps:
1. Go to /admin/invoices
2. Should display table with columns:
   - Invoice #
   - Order #
   - Client
   - Issue Date
   - Due Date
   - Amount
   - Status
   - Action

3. Verify invoices display (create test invoices first)
4. No console errors

Expected: ✅ Invoice table displays correctly
```

### Test 5.2: Search & Filter
```
Steps:
1. Search box: try "INV-2025"
   - Matching invoices display
2. Status filter: select "Unpaid"
   - Only unpaid invoices show
3. Sort: "Amount (Highest)"
   - Largest invoices first
4. Sort: "Date (Newest)"
   - Most recent first

Expected: ✅ Search, filter, and sort work correctly
```

### Test 5.3: Overdue Detection
```
Steps:
1. In invoices table, find overdue invoice
2. Due date should be red
3. Should show "X days overdue" message
4. Payment status should be "Unpaid" or "Partial"

Expected: ✅ Overdue invoices highlighted correctly
```

### Test 5.4: Invoice Detail Panel
```
Steps:
1. Click "View" on any invoice
2. Right panel opens with:
   - Invoice number & order
   - Client info
   - Issue date & due date
   - Amount breakdown (exc VAT, VAT, total)
   - Payment status dropdown
   - PDF upload status
   - Admin notes

Expected: ✅ All invoice details display correctly
```

### Test 5.5: Payment Status Update
```
Steps:
1. Open invoice detail panel
2. Status: "Unpaid"
3. Click dropdown, select "Partial"
4. Toast: "Payment status updated to Partial"
5. Dropdown color changes (yellow)
6. Close/reopen panel
7. Status persists

Expected: ✅ Payment status updates and persists
```

### Test 5.6: Auto-Complete Order Logic
```
Steps:
1. Set order status to "Delivered"
2. Invoice status: "Unpaid"
3. Open invoice detail panel
4. Change payment status to "Paid"
5. Toast: "Order auto-completed (Invoice Paid + Order Delivered)"
6. Go to Orders page
7. Order status should be "Completed"

Expected: ✅ Auto-complete triggers when both conditions met
```

### Test 5.7: Admin Notes
```
Steps:
1. Open invoice detail panel
2. Scroll to Admin Notes
3. Type: "Payment received from client"
4. Click "Save Notes"
5. Toast: "Notes saved successfully"
6. Close and reopen panel
7. Note persists

Expected: ✅ Admin notes work correctly
```

---

## 📧 PHASE 6: Email Notifications Testing

### Test 6.1: Email Notification Table
```
Steps:
1. Go to Supabase → Table Editor
2. Find email_notifications table
3. Verify columns exist:
   - recipient_email
   - recipient_name
   - email_type
   - subject
   - body
   - status (pending/sent/failed)
   - created_at

Expected: ✅ Table structure is correct
```

### Test 6.2: Order Status Email Trigger
```
Steps:
1. Create a test order
2. Go to Supabase → Table Editor → orders
3. Update order status: in_review → confirmed
4. Go to email_notifications table
5. Should see new record with:
   - email_type: 'order_confirmed'
   - subject contains order number
   - status: 'pending'

Expected: ✅ Email trigger fires on status change
```

### Test 6.3: Create Invoice Dialog
```
Steps:
1. Go to /admin/invoices
2. Click "+ New Invoice" button
3. Modal opens with:
   - "Select Order" dropdown
   - Issue Date field (today)
   - Due Date field (today + 14 days)
   - Amount breakdown
   - Cancel & Create buttons

4. Select an order from dropdown
5. Amounts pre-fill with VAT calculation
6. Click "Create Invoice"
7. Toast: "Invoice created successfully!"
8. Modal closes
9. Check invoices table - new invoice appears

Expected: ✅ Invoice creation works end-to-end
```

### Test 6.4: Invoice Number Generation
```
Steps:
1. Create multiple invoices
2. Check invoice numbers in Supabase
3. Format should be: INV-2025-000001, INV-2025-000002, etc.
4. Each number unique
5. Sequential within same year

Expected: ✅ Invoice numbers are unique and sequential
```

### Test 6.5: VAT Calculation
```
Steps:
1. Create invoice with amount €1000 (inc. VAT)
2. Verify breakdown:
   - Exc. VAT: €826.45 (≈ 1000/1.21)
   - VAT (21%): €173.55
   - Total: €1000.00

3. Edit amount to €500
4. Recalculate:
   - Exc. VAT: €413.22
   - VAT: €86.78
   - Total: €500.00

Expected: ✅ VAT calculation is accurate
```

### Test 6.6: PDF Upload Zone (UI)
```
Steps:
1. Open invoice detail panel
2. Scroll to "PDF Document" section
3. Should show:
   - "No PDF uploaded" (if empty)
   - Or "PDF Uploaded" (if already uploaded)
   - Upload zone with drag-and-drop area

Expected: ✅ PDF section displays correctly
```

### Test 6.7: PDF Upload (With Test File)
```
Steps:
1. Create a small test PDF (or find one)
2. In invoice detail panel, drag-drop PDF to upload zone
3. Loading animation shows
4. Toast: "PDF uploaded successfully!"
5. Status changes to "PDF Uploaded"
6. Go to Supabase Storage → invoices folder
7. File should exist

Expected: ✅ PDF uploads to storage successfully
```

### Test 6.8: PDF Upload Validation
```
Steps:
1. Try uploading non-PDF file (e.g., txt, jpg)
2. Toast: "Please upload a PDF file"
3. Upload rejected
4. Try uploading file >5MB
5. Toast: "File size must be less than 5MB"
6. Upload rejected

Expected: ✅ Validation works correctly
```

---

## 🔐 Security & RLS Testing

### Test 7.1: Admin-Only Access
```
Steps:
1. Log in as regular client user
2. Try to navigate to http://localhost:5173/admin/orders
3. Should redirect to /dashboard
4. Client cannot access admin features

Expected: ✅ Non-admin users blocked from admin pages
```

### Test 7.2: RLS Policies
```
Steps:
1. Log in as non-admin
2. Open browser DevTools → Network tab
3. Try to access calendar_slots data
4. Query should fail or return no data
5. Only admins can view calendar_slots

Expected: ✅ RLS policies enforce data access
```

### Test 7.3: Audit Logging
```
Steps:
1. Perform admin action:
   - Update order status
   - Create invoice
   - Upload PDF
   - Save admin notes

2. Go to Supabase → admin_activity_log table
3. Each action should be logged with:
   - admin_id (your user ID)
   - action (order_status_change, etc.)
   - target_table
   - target_id
   - old_values, new_values
   - created_at

Expected: ✅ All actions are audit logged
```

### Test 7.4: Email Notification Logging
```
Steps:
1. Update order status (should trigger email)
2. Go to Supabase → email_notifications table
3. New record should exist with:
   - recipient_email
   - email_type
   - subject/body
   - status: pending
   - created_at

Expected: ✅ Email notifications are logged
```

---

## ⚡ Performance Testing

### Test 8.1: Page Load Time
```
Steps:
1. Open DevTools → Performance tab
2. Reload /admin/dashboard
3. Check metrics:
   - First Contentful Paint (FCP): <1.5s
   - Largest Contentful Paint (LCP): <2.5s
   - Time to Interactive (TTI): <3.5s

Expected: ✅ Pages load in reasonable time
```

### Test 8.2: Large Data Sets
```
Steps:
1. Create 100+ test orders
2. Load /admin/orders page
3. Check for lag or freezing
4. Scrolling should be smooth
5. Search should respond quickly

Expected: ✅ App handles large datasets without lag
```

### Test 8.3: Real-Time Updates
```
Steps:
1. Have two browser windows open
2. Window A: /admin/orders
3. Window B: Create a new order via client portal
4. Window A: Refresh or wait for auto-refresh
5. New order should appear

Expected: ✅ Data updates reflect quickly
```

---

## 🧪 Database & API Testing

### Test 9.1: Database Migrations
```
Steps:
1. Go to Supabase → SQL Editor
2. Run: SELECT * FROM information_schema.tables 
   WHERE table_name IN ('orders', 'invoices', 'calendar_slots', 
   'admin_activity_log', 'email_notifications')
3. All 5+ tables should exist

4. Run: SELECT * FROM pg_indexes 
   WHERE tablename IN ('calendar_slots', 'invoices')
5. Indexes should exist for performance

Expected: ✅ All database tables and indexes exist
```

### Test 9.2: Sequences
```
Steps:
1. Go to Supabase → SQL Editor
2. Run: SELECT * FROM information_schema.sequences 
   WHERE sequence_name IN ('order_number_seq', 'invoice_number_seq')
3. Both sequences should exist
4. Check current values:
   SELECT last_value FROM order_number_seq
   SELECT last_value FROM invoice_number_seq

Expected: ✅ Sequences exist for atomic number generation
```

### Test 9.3: Functions & Triggers
```
Steps:
1. In SQL Editor, run:
   SELECT routine_name FROM information_schema.routines 
   WHERE routine_name IN ('generate_order_number', 
   'generate_invoice_number', 'log_email_notification')
2. All functions should exist

3. Run: SELECT trigger_name FROM information_schema.triggers
4. order_status_email_trigger should exist

Expected: ✅ All functions and triggers are created
```

---

## 🔄 End-to-End Workflow Testing

### Workflow 1: Complete Order to Invoice to Payment
```
Timeline:
1. Client creates order (Order Portal)
   → Status: in_review
   → Email: "order_submitted" logged

2. Admin confirms order (/admin/orders)
   → Status: in_review → confirmed
   → Email: "order_confirmed" logged

3. Admin assigns calendar slot (/admin/orders)
   → Status: confirmed → planned
   → Calendar slot created
   → Email: "order_planned" logged

4. Admin uploads deliverables (/admin/orders)
   → Status: planned → delivered
   → Email: "order_delivered" logged

5. Admin creates invoice (/admin/invoices → New Invoice)
   → Invoice created: INV-2025-000001
   → Status: unpaid
   → Email: "invoice_created" logged

6. Admin uploads PDF (/admin/invoices)
   → PDF stored
   → Status updated

7. Admin updates payment status (/admin/invoices)
   → Status: unpaid → paid
   → Order auto-completes: status → completed
   → Email: "invoice_paid" logged

Verify:
- ✅ Order status: completed
- ✅ Invoice status: paid
- ✅ All 7 emails logged in email_notifications
- ✅ All actions logged in admin_activity_log
- ✅ Calendar slot locked (yellow)
```

---

## 📝 Testing Checklist Summary

Use this checklist to track testing:

```
PHASE 1: Foundation & Authentication
☐ Admin route protection works
☐ Admin authentication works
☐ Role checking works

PHASE 2: Dashboard
☐ Statistics display correctly
☐ Recent orders widget works
☐ Quick action cards navigate correctly

PHASE 3: Orders Management
☐ Orders listing displays
☐ Search works
☐ Status filter works
☐ Detail panel opens
☐ Status workflow works
☐ Admin notes save
☐ Slot assignment works

PHASE 4: Calendar Manager
☐ Calendar displays 12 months
☐ Slot management works
☐ Bulk actions work (repeat, copy, clear, blackout)
☐ Past dates protected
☐ Booked slots locked

PHASE 5: Invoices
☐ Invoice listing displays
☐ Search & filter work
☐ Overdue detection works
☐ Detail panel works
☐ Payment status updates
☐ Auto-complete logic works
☐ Admin notes work

PHASE 6: Email & Notifications
☐ Email notification table exists
☐ Order status triggers emails
☐ Create invoice dialog works
☐ Invoice numbers unique & sequential
☐ VAT calculation correct
☐ PDF upload works
☐ PDF validation works

SECURITY
☐ Admin-only access enforced
☐ RLS policies work
☐ Audit logging works
☐ Email logging works

PERFORMANCE
☐ Pages load in <3s
☐ Large datasets handled
☐ Real-time updates work

DATABASE
☐ All tables exist
☐ All indexes exist
☐ All sequences exist
☐ All functions exist
☐ All triggers exist

END-TO-END
☐ Complete workflow functions correctly
```

---

## 🚀 After Testing - Deployment

Once all tests pass:

1. **Deploy to Production**
   ```bash
   npm run build
   # Deploy dist/ folder to hosting
   ```

2. **Configure Email Service**
   - Set up SendGrid/Mailgun/etc.
   - Update email trigger functions
   - Test email delivery

3. **Monitor**
   - Check error logs
   - Monitor email queue
   - Track user feedback

4. **Post-Deployment Testing**
   - Test with real production data
   - Verify all integrations
   - Monitor performance

---

## ❓ Troubleshooting Common Issues

### Issue: "Cannot modify past dates" on all dates
**Solution:** Check calendar_slots table - may be timezone issue

### Issue: Email notifications not logging
**Solution:** Check RLS policies on email_notifications table

### Issue: Invoice numbers duplicate
**Solution:** Restart Supabase service to reset sequence

### Issue: PDF upload fails
**Solution:** Check Supabase Storage bucket permissions (public read, authenticated write)

### Issue: Calendar slot assignment fails
**Solution:** Verify calendar_slots table exists and RLS is correct

---

Good luck with testing! 🧪✨
