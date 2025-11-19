# 📊 IMMOAURA ADMIN PANEL - COMPLETE USER GUIDE

**Last Updated:** November 4, 2025  
**Project:** Immoaura Client Portal  
**Admin Dashboard:** `https://portal.immoaura.be/admin`

---

## 📋 TABLE OF CONTENTS

1. [Getting Started](#getting-started)
2. [Admin Login](#admin-login)
3. [Dashboard Overview](#dashboard-overview)
4. [Calendar Management](#calendar-management)
5. [Order Management](#order-management)
6. [Invoice Management](#invoice-management)
7. [Client Messages](#client-messages)
8. [Admin Settings](#admin-settings)
9. [Activity Logs](#activity-logs)
10. [User Management](#user-management)
11. [Troubleshooting](#troubleshooting)

---

## 🚀 GETTING STARTED

### What is the Admin Panel?

The Admin Panel is where you manage:
- ✅ Client orders
- ✅ Invoices and billing
- ✅ Calendar and availability
- ✅ Client communications
- ✅ System settings
- ✅ Activity tracking

### Access Requirements

- ✅ Valid admin account (role = 'admin')
- ✅ Active internet connection
- ✅ Modern web browser (Chrome, Firefox, Safari, Edge)
- ✅ Stable Supabase database connection

---

## 🔐 ADMIN LOGIN

### How to Login

1. **Go to website:** `https://portal.immoaura.be/`
2. **Enter credentials:**
   - Email: Your admin email
   - Password: Your admin password
3. **Click "Sign In"**
4. **Verify email** (if first time or new device)
5. **Redirected to dashboard**

### First Time Admin Setup

1. **Sign up** on the main website
2. **Contact database admin** to set your role to 'admin'
   - Or use Supabase SQL: `UPDATE users SET role='admin' WHERE email='your@email.com';`
3. **Logout and login again**
4. **Go to `/admin` page**
5. **Admin panel loads** ✅

### Forgot Password?

1. Click **"Forgot password?"** on login page
2. Enter your email
3. Check email for reset link
4. Create new password
5. Login with new password

---

## 📈 DASHBOARD OVERVIEW

### Main Dashboard Screen

The admin dashboard shows:

```
┌─────────────────────────────────────────┐
│         ADMIN DASHBOARD                 │
├─────────────────────────────────────────┤
│  📊 Statistics                          │
│  ├─ Total Orders                        │
│  ├─ Pending Orders                      │
│  ├─ Confirmed Orders                    │
│  └─ Revenue                             │
│                                         │
│  🗓️ Calendar | 📦 Orders | 💰 Invoices│
│  💬 Messages | ⚙️ Settings | 📋 Logs  │
└─────────────────────────────────────────┘
```

### Key Metrics

| Metric | Description |
|--------|-------------|
| **Total Orders** | All orders from all clients |
| **Pending Orders** | Orders awaiting confirmation |
| **Confirmed Orders** | Orders confirmed & scheduled |
| **Delivered Orders** | Orders completed & ready |
| **Total Revenue** | Sum of all invoice amounts |

### Navigation Menu

Located in sidebar:
- 🏠 **Dashboard** - Overview & statistics
- 🗓️ **Calendar** - Manage availability slots
- 📦 **Orders** - View & manage orders
- 💰 **Invoices** - Create & manage invoices
- 💬 **Messages** - Client communications
- ⚙️ **Settings** - Configure system
- 📋 **Logs** - View activity history

---

## 🗓️ CALENDAR MANAGEMENT

### What is the Calendar?

The calendar shows your availability slots where clients can schedule orders.

### Calendar Types

| Type | Meaning | Color |
|------|---------|-------|
| **Open** | Available for booking | 🟢 Green |
| **Booked** | Slot is taken | 🔵 Blue |
| **Blackout** | Unavailable/Blocked | ⚫ Black |

### How to Add Availability

1. **Go to:** Calendar tab
2. **Click "Add Slot"**
3. **Select date** from calendar picker
4. **Enter start time** (e.g., 09:00 AM)
5. **Enter end time** (e.g., 05:00 PM)
6. **Set status:** Open (for available slot)
7. **Click "Save"**
8. ✅ Slot created!

### Example:
```
Monday, Nov 10, 2025
Start: 09:00 AM
End: 05:00 PM
Status: Open
→ Clients can book during this time
```

### How to Block Time (Blackout)

1. **Go to:** Calendar tab
2. **Click "Add Slot"**
3. **Select date** you want to block
4. **Enter time range** (e.g., 1:00 PM - 2:00 PM)
5. **Set status:** Blackout
6. **Click "Save"**
7. ✅ Time blocked!

### Managing Existing Slots

**Edit a slot:**
1. Click on the slot
2. Modify date/time
3. Click "Update"

**Delete a slot:**
1. Click on the slot
2. Click "Delete"
3. Confirm deletion

### Calendar Tips

- ✅ Add availability at least 1 week in advance
- ✅ Block time for breaks (lunch, admin tasks)
- ✅ Consider buffer time between appointments
- ✅ Update calendar regularly
- ✅ Clients book in real-time!

---

## 📦 ORDER MANAGEMENT

### Understanding Order Statuses

| Status | Meaning | Next Step |
|--------|---------|-----------|
| **in_review** | New order, awaiting review | Review & confirm |
| **confirmed** | Order approved | Assign to calendar slot |
| **planned** | Scheduled for specific date | Execute on date |
| **delivered** | Work completed | Create invoice |
| **completed** | Invoice paid & finished | Archive |

### View All Orders

1. **Go to:** Orders tab
2. **See all orders** from all clients
3. **Sort by:** Status, Date, Client
4. **Filter:** Pending, Confirmed, Planned, etc.

### View Order Details

1. **Click on order** in list
2. **See details:**
   - Client name & email
   - Order date created
   - Status
   - Order description
   - Total price
   - Admin notes
   - Assigned calendar slot

### Confirm an Order

1. **Find order** with status "in_review"
2. **Click order** to open
3. **Review details** (description, price, dates)
4. **Click "Confirm Order"**
5. **Order status changes** to "confirmed"
6. ✅ Client notified via email!

### Assign Calendar Slot

1. **Find confirmed order**
2. **Click order** to open
3. **Click "Assign Calendar Slot"**
4. **Select date** from calendar
5. **Select time** from available slots
6. **Click "Assign"**
7. **Order status changes** to "planned"
8. ✅ Slot marked as booked!

### Update Order Status

1. **Click order**
2. **Change status dropdown:**
   - in_review → confirmed
   - confirmed → planned
   - planned → delivered
   - delivered → completed
3. **Click "Update"**
4. ✅ Status changed!

### Add Admin Notes

1. **Click order**
2. **Scroll to "Admin Notes"**
3. **Type notes** (instructions, reminders, etc.)
4. **Click "Save Notes"**
5. ✅ Notes saved!

### Example Workflow

```
1. Client submits order
   Status: in_review

2. Admin reviews & confirms
   Status: confirmed
   Client gets email: "Order Confirmed!"

3. Admin assigns calendar slot
   Status: planned
   Client gets email: "Order Scheduled!"
   Calendar slot marked as booked

4. Work is completed
   Admin changes to delivered
   Status: delivered
   Client gets email: "Order Delivered!"

5. Invoice is created & paid
   Status: completed
   Order archived
```

---

## 💰 INVOICE MANAGEMENT

### What is an Invoice?

An invoice is a billing record for completed work:
- Tracks payment status
- Stores amount & tax
- Links to specific order
- Records payment history

### Invoice Statuses

| Status | Meaning |
|--------|---------|
| **unpaid** | Sent to client, awaiting payment |
| **partial** | Client paid partial amount |
| **paid** | Fully paid |

### Create Invoice

1. **Go to:** Invoices tab
2. **Click "Create Invoice"**
3. **Select order:** Choose from delivered orders
4. **Enter dates:**
   - Issue date: Today (auto-filled)
   - Due date: Payment deadline
5. **Enter amounts:**
   - Amount excl. VAT: Base price
   - VAT amount: Tax (auto-calculates at 21%)
   - Amount incl. VAT: Total (auto-calculates)
6. **Add notes** (optional payment terms, etc.)
7. **Click "Create"**
8. ✅ Invoice created!

### Example Invoice Calculation

```
Base Price (excl. VAT):     €1,000.00
VAT (21%):                   €  210.00
────────────────────────────────────
Total (incl. VAT):           €1,210.00

Invoice Status: unpaid
Due Date: Nov 15, 2025
```

### View All Invoices

1. **Go to:** Invoices tab
2. **See list** of all invoices
3. **Filter by:**
   - Payment status (unpaid, paid)
   - Date range
   - Client
4. **Sort by:** Date, Amount, Status

### Track Invoice Payment

1. **Click invoice**
2. **Check payment status:**
   - unpaid: Waiting for payment
   - partial: Received part of amount
   - paid: Fully paid ✅
3. **See payment history**
4. **View PDF** if uploaded

### Update Payment Status

1. **Click invoice**
2. **Click "Update Payment Status"**
3. **Select new status:**
   - unpaid (not paid yet)
   - partial (paid some amount)
   - paid (fully paid)
4. **Enter amount paid** (if partial)
5. **Click "Update"**
6. ✅ Status updated!

### Generate Invoice PDF

1. **Click invoice**
2. **Click "Download PDF"**
3. **PDF downloads** to your computer
4. **Can be emailed** to client

### Invoice Tips

- ✅ Create invoices after work is delivered
- ✅ Set realistic due dates (e.g., 15 days)
- ✅ Keep VAT rate at 21% (standard Belgium rate)
- ✅ Track payment status regularly
- ✅ Follow up on overdue invoices

---

## 💬 CLIENT MESSAGES

### Message Types

| Type | Triggered By |
|------|--------------|
| **Order Submitted** | Client creates order |
| **Order Confirmed** | Admin confirms order |
| **Order Planned** | Order assigned to calendar |
| **Order Delivered** | Admin changes status to delivered |
| **Invoice Created** | New invoice generated |
| **Invoice Overdue** | Invoice not paid by due date |

### View Messages

1. **Go to:** Messages tab
2. **See all messages** sent to clients
3. **View details:**
   - Message type
   - Client email
   - Subject
   - Body content
   - Send date & time
   - Delivery status

### Message Statuses

| Status | Meaning |
|--------|---------|
| **pending** | Queued to send |
| **sent** | Successfully delivered |
| **failed** | Failed to send |
| **bounced** | Email bounced back |

### Resend Failed Message

1. **Find message** with status "failed"
2. **Click message**
3. **Click "Resend"**
4. **Message re-queued**
5. ✅ Will retry sending!

### Search Messages

1. **Use search bar** at top
2. **Search by:**
   - Client email
   - Message type
   - Date range
3. **View filtered results**

### Message Tips

- ✅ Messages are automatic (triggered by order changes)
- ✅ Monitor failed messages
- ✅ Resend if client didn't receive
- ✅ Check spam/junk folder with clients
- ✅ All messages logged for audit trail

---

## ⚙️ ADMIN SETTINGS

### System Configuration

The settings page lets you customize system behavior.

### Available Settings

#### Email Configuration
- ✅ Sender email address
- ✅ Reply-to email
- ✅ Email templates
- ✅ Notification preferences

#### Business Information
- ✅ Company name
- ✅ Company logo
- ✅ Invoice footer text
- ✅ Contact information

#### Order Settings
- ✅ Default order status
- ✅ Auto-confirmation setting
- ✅ Order number prefix
- ✅ Maximum concurrent orders

#### Invoice Settings
- ✅ VAT rate (default: 21%)
- ✅ Invoice number format
- ✅ Payment terms (default: 15 days)
- ✅ Late payment fee

#### Calendar Settings
- ✅ Business hours
- ✅ Days off
- ✅ Slot duration (default: 1 hour)
- ✅ Lead time (how far ahead clients can book)

### How to Update Settings

1. **Go to:** Settings tab
2. **Find setting** to change
3. **Click "Edit"**
4. **Enter new value**
5. **Click "Save"**
6. ✅ Setting updated!

### Settings Tips

- ✅ Test changes before finalizing
- ✅ Backup old values before major changes
- ✅ Keep business hours reasonable
- ✅ Update contact info regularly
- ✅ Review VAT rate annually

---

## 📋 ACTIVITY LOGS

### What are Activity Logs?

Activity logs track all admin actions for security & audit purposes:
- ✅ Who made changes
- ✅ What was changed
- ✅ When it happened
- ✅ Previous & new values

### View Activity Logs

1. **Go to:** Logs tab
2. **See all activities**
3. **View details:**
   - Admin name (who made change)
   - Action type (create, update, delete)
   - Object type (order, invoice, calendar)
   - Timestamp
   - Old values
   - New values

### Filter Logs

- **By admin:** See specific admin's actions
- **By action:** View create/update/delete
- **By date:** Filter by date range
- **By object:** View changes to orders/invoices/etc.

### Example Log Entry

```
Admin: John Smith
Action: Updated Order
Object: Order #IM-000001
Time: Nov 4, 2025 2:30 PM

OLD VALUES:
  Status: in_review
  Admin Notes: (empty)

NEW VALUES:
  Status: confirmed
  Admin Notes: Client confirmed via phone
```

### Activity Log Tips

- ✅ Review logs daily for security
- ✅ Track who changed what
- ✅ Identify discrepancies
- ✅ Maintain audit trail
- ✅ Keep for compliance (minimum 1 year)

---

## 👥 USER MANAGEMENT

### View All Users

1. **Go to:** (in dashboard or via SQL)
2. **See all registered users**
3. **View details:**
   - Email
   - Full name
   - Business name
   - Role (client/admin)
   - Registration date

### User Roles

| Role | Permissions |
|------|-------------|
| **client** | View own orders & invoices |
| **admin** | Full access to admin panel |

### Create New Admin

1. **User must signup** on main website first
2. **Go to Supabase Dashboard**
3. **Open SQL Editor**
4. **Run query:**
   ```sql
   UPDATE users SET role = 'admin' 
   WHERE email = 'new-admin@example.com';
   ```
5. **New admin can now access /admin**

### Remove Admin Access

1. **Go to Supabase SQL Editor**
2. **Run query:**
   ```sql
   UPDATE users SET role = 'client' 
   WHERE email = 'admin@example.com';
   ```
3. **Admin loses access to /admin**

### Disable User Account

1. **Go to Supabase Authentication**
2. **Find user**
3. **Click "Disable User"**
4. **User cannot login**
5. **Existing sessions end**

---

## 🆘 TROUBLESHOOTING

### Common Issues & Solutions

#### Issue: Can't access admin panel

**Solutions:**
1. Check you're logged in as admin user
2. Verify role is set to 'admin' in database
3. Clear browser cache
4. Hard refresh: Ctrl+Shift+R
5. Try different browser
6. Check internet connection

#### Issue: Calendar slots not showing

**Solutions:**
1. Check if slots exist (add some)
2. Check date range (current/future dates)
3. Refresh page
4. Clear browser cache
5. Check slot status (Open/Blackout)

#### Issue: Orders not appearing

**Solutions:**
1. Check filters (may be filtered by status)
2. Ensure orders exist in database
3. Check client created order
4. Refresh page
5. Clear filters

#### Issue: Can't create invoice

**Solutions:**
1. Check order status is "delivered"
2. Only delivered orders eligible
3. Check order exists
4. Verify order has price
5. Try refreshing page

#### Issue: Email confirmations not received

**Solutions:**
1. Check email spam/junk folder
2. Verify email address is correct
3. Check Supabase settings:
   - Site URL: https://portal.immoaura.be
   - Redirect URLs include /auth/callback
4. Try resending from Messages tab

#### Issue: Dashboard loading slowly

**Solutions:**
1. Check internet connection
2. Clear browser cache
3. Close unnecessary tabs
4. Try different browser
5. Check Supabase status
6. Reduce date range in filters

#### Issue: Settings not saving

**Solutions:**
1. Check internet connection
2. Verify all required fields filled
3. Check for validation errors
4. Try saving individual settings
5. Check browser console for errors

---

## 📞 SUPPORT & HELP

### Quick Tips

- ✅ Save work frequently
- ✅ Clear cache if issues occur
- ✅ Check internet connection
- ✅ Use modern browser
- ✅ Report bugs with screenshots

### Resources

- **Dashboard:** https://portal.immoaura.be/admin
- **Website:** https://portal.immoaura.be/
- **Database:** https://app.supabase.com/ (ekswazmqhwtxzgdckpxt)
- **Email:** support@immoaura.be (if available)

### Emergency Contacts

If critical issues occur:
1. Check Supabase status: https://status.supabase.com/
2. Check your internet connection
3. Try accessing from different device
4. Clear all browser data
5. Contact technical support

---

## 🎓 BEST PRACTICES

### Daily Tasks

- ✅ Check for new orders
- ✅ Confirm pending orders
- ✅ Update calendar availability
- ✅ Review messages
- ✅ Follow up on overdue invoices

### Weekly Tasks

- ✅ Review activity logs
- ✅ Reconcile invoices vs payments
- ✅ Plan calendar for next week
- ✅ Check system settings
- ✅ Update business information

### Monthly Tasks

- ✅ Generate monthly reports
- ✅ Review all invoices
- ✅ Reconcile accounts
- ✅ Backup important data
- ✅ Update VAT rates if needed

### Security Tips

- ✅ Use strong password
- ✅ Change password regularly
- ✅ Never share admin credentials
- ✅ Logout after use
- ✅ Monitor activity logs
- ✅ Keep browser updated

---

## 📊 EXAMPLE WORKFLOW

### Complete Order-to-Invoice Process

```
DAY 1 - ORDER RECEIVED
┌─────────────────────────────┐
│ Client submits order        │
│ Status: in_review           │
│ Admin receives notification │
└─────────────────────────────┘
         ↓
┌─────────────────────────────┐
│ Admin reviews order details │
│ ✓ Description looks good    │
│ ✓ Price is correct          │
│ ✓ Timeline is feasible      │
└─────────────────────────────┘

DAY 2 - ORDER CONFIRMED
┌─────────────────────────────┐
│ Admin confirms order        │
│ Status: confirmed           │
│ Client gets email alert     │
└─────────────────────────────┘
         ↓
┌─────────────────────────────┐
│ Admin assigns calendar slot │
│ Selects date: Nov 10, 2025  │
│ Time: 10:00 AM - 3:00 PM    │
│ Status: planned             │
│ Client gets email alert     │
└─────────────────────────────┘

DAY 10 - WORK COMPLETED
┌─────────────────────────────┐
│ Admin completes work        │
│ Changes status: delivered   │
│ Client gets email alert     │
│ Work is ready for pickup    │
└─────────────────────────────┘

DAY 11 - INVOICE CREATED
┌─────────────────────────────┐
│ Admin creates invoice       │
│ Base: €1,000.00             │
│ VAT: €210.00 (21%)          │
│ Total: €1,210.00            │
│ Due: Nov 25, 2025           │
└─────────────────────────────┘
         ↓
┌─────────────────────────────┐
│ Admin sends invoice         │
│ Client receives PDF         │
│ Status: unpaid              │
└─────────────────────────────┘

DAY 25 - PAYMENT RECEIVED
┌─────────────────────────────┐
│ Client pays invoice         │
│ Admin updates status        │
│ Status: paid                │
│ Order complete! ✓           │
└─────────────────────────────┘
```

---

## ✅ FINAL CHECKLIST

Before your first admin day:

- ☐ Login to admin panel works
- ☐ All menu items accessible
- ☐ Calendar has availability slots
- ☐ Sample order created for testing
- ☐ Invoice created successfully
- ☐ Activity logs visible
- ☐ Settings reviewed
- ☐ Understand all statuses
- ☐ Email notifications working
- ☐ Know your role as admin

---

**Now you're ready to manage your Immoaura Client Portal! 🎉**

For questions or issues, refer back to this guide or check the Supabase dashboard.

---

*This guide was created November 4, 2025*  
*Version: 1.0*  
*Last Updated: November 4, 2025*
