# 📊 Admin Panel Implementation Plan

Based on **Admin Brief - Immoaura (Backend & QA).md**

---

## 📋 Overview

The Admin Panel is a separate interface for administrators to:
- ✅ Manage order statuses (In Review → Confirmed → Planned → Delivered → Completed)
- ✅ Assign/lock calendar slots for Property Video orders
- ✅ Upload deliverables and communicate with clients
- ✅ Create and manage invoices (manual generation from orders)
- ✅ Manage global 12-month calendar availability
- ✅ Auto-trigger emails on status changes

---

## 🏗️ Architecture Overview

```
Admin Panel (Separate Route: /admin/*)
├── Admin Dashboard (/admin/dashboard)
│   ├── Overview stats
│   ├── Pending orders list
│   └── Recent activities
├── Orders Management (/admin/orders)
│   ├── All orders table (filterable)
│   ├── Order detail page
│   └── Status change + slot assignment
├── Invoices Management (/admin/invoices)
│   ├── All invoices table
│   ├── Create invoice from order
│   └── Upload PDF + manage payment
├── Calendar Manager (/admin/calendar)
│   ├── 12-month calendar view
│   ├── Blackout/open slots
│   └── Bulk actions
└── Admin Settings (/admin/settings)
    └── User management, email config
```

---

## 🔐 Authentication & Authorization

### Database Changes Needed:
```sql
-- Add admin role to users table
ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'client' CHECK (role IN ('client', 'admin'));

-- Create admin_settings table
CREATE TABLE admin_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create admin_activity_log table for audit trail
CREATE TABLE admin_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES users(id),
  action TEXT NOT NULL,
  target_table TEXT,
  target_id UUID,
  changes JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Auth Middleware:
- Check if user's role = 'admin' before showing admin pages
- Protect admin API endpoints with RLS policies
- Log all admin actions to audit table

---

## 1️⃣ Admin Dashboard Page

### Location:
`src/pages/Admin.tsx` (main admin entry point)  
`src/pages/AdminDashboard.tsx` (dashboard view)

### Features:
```
┌─────────────────────────────────────────────────────┐
│ Admin Dashboard                                     │
├─────────────────────────────────────────────────────┤
│                                                     │
│ Stats Grid:                                         │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │
│ │ Total Orders│ │ In Review   │ │ Pending     │   │
│ │     24      │ │      5      │ │ Invoices: 3 │   │
│ └─────────────┘ └─────────────┘ └─────────────┘   │
│                                                     │
│ Recent Orders Table:                                │
│ ┌─────────────────────────────────────────────────┐│
│ │Order# │ Client │ Status │ Amount │ Action      ││
│ ├─────────────────────────────────────────────────┤│
│ │IM-001 │ John D │Confirmed│€850  │ Manage...  ││
│ │IM-002 │ Jane S │ In Review │€1,200│ Manage...  ││
│ └─────────────────────────────────────────────────┘│
│                                                     │
│ Quick Actions:                                      │
│ [Create Invoice] [View Calendar] [Messages]        │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Data to Show:
- Total orders count
- Orders by status breakdown
- Pending invoices count
- Upcoming calendar slots
- Recent admin activities
- Messages from clients

---

## 2️⃣ Orders Management

### Location:
`src/pages/AdminOrders.tsx`  
`src/components/admin/OrdersTable.tsx`  
`src/components/admin/OrderDetailPanel.tsx`

### Features:

#### Orders List View:
```
┌─────────────────────────────────────────────────────────────┐
│ All Orders (Filter by: Status, Date, Client, Amount)        │
├─────────────────────────────────────────────────────────────┤
│Order# │ Client │ Services │ Status │ Price │ Slot │ Actions│
├─────────────────────────────────────────────────────────────┤
│IM-001 │ John   │ Video    │Confirmed│€850  │ ✓   │ ▼     │
│IM-002 │ Jane   │ Video+2D │In Review │€1,200│ -   │ ▼     │
└─────────────────────────────────────────────────────────────┘
```

#### Order Detail View:
1. **Order Info Section:**
   - Order number, client name, date created
   - Services selected, configurations

2. **Status Change Dropdown:**
   - In Review → Confirmed → Planned → Delivered → Completed
   - Can also set to Cancelled

3. **Calendar Slot (for Video only):**
   - Show available slots when status = Planned
   - Lock slot when assigned
   - Display selected slot

4. **Deliverables Section:**
   - Upload files (PDF, images, etc.)
   - Add delivery notes
   - Download history

5. **Client Messages:**
   - View client messages
   - Send responses to client email

6. **Price Breakdown:**
   - Always visible
   - Can adjust if needed (approval log)

#### Email Auto-Triggers:
```
On Status Change:
- In Review: Client + Admin notification
- Confirmed: Client email "Your order is confirmed"
- Planned: Client email with slot date/time + 24h reminder
- Delivered: Client email with download links + invoice reminder
- Completed: Client email "Order completed"
```

---

## 3️⃣ Invoices Management

### Location:
`src/pages/AdminInvoices.tsx`  
`src/components/admin/InvoicesTable.tsx`  
`src/components/admin/InvoiceForm.tsx`

### Features:

#### Create Invoice from Order:
```
Button: "Create Invoice" (on Order detail page)

Pre-filled Form:
┌──────────────────────────────────┐
│ Invoice Number: INV-2025-000001   │
│ Reference: IM-001                 │
│ Issue Date: [Today] (editable)    │
│ Expiry Date: [+14 days] (edit.)   │
│ Amount: €1,200.00 (editable)      │
│ Client Email: [auto-filled]       │
│ PDF Upload: [Choose File]         │
│ [Save] [Cancel]                   │
└──────────────────────────────────┘
```

#### Invoice List:
```
┌────────────────────────────────────────────────┐
│ All Invoices (Filter by: Status, Client, Date)│
├────────────────────────────────────────────────┤
│Invoice# │ Order │ Amount │ Status │ Due   │   │
├────────────────────────────────────────────────┤
│INV-2025-│IM-001 │€1,200  │Paid    │ -    │ ▼ │
│000001   │       │        │        │      │   │
└────────────────────────────────────────────────┘
```

#### Invoice Statuses:
- **Unpaid**: Default state
- **Partial**: Payment received but not full amount
- **Paid**: Full payment received

#### Auto-Actions:
```
When Invoice = Paid AND Order = Delivered:
  → Automatically set Order status = Completed
  → Send completion email to client
```

#### Emails:
- Invoice issued notification
- Overdue reminder (7 days before expiry)
- Payment confirmation

---

## 4️⃣ Global Calendar Manager

### Location:
`src/pages/AdminCalendar.tsx`  
`src/components/admin/CalendarGrid.tsx`  
`src/components/admin/CalendarControls.tsx`

### Features:

#### Calendar View:
```
12-Month View for Property Video:
┌────────────────────────────────────────────────────────┐
│ Calendar Manager                                       │
├────────────────────────────────────────────────────────┤
│                                                        │
│ Show Months: [Nov] [Dec] [Jan] [Feb] [Mar]  ...      │
│                                                        │
│ November 2025                   December 2025          │
│ ┌─────────────────────┐ ┌─────────────────────┐       │
│ │Mo Tu We Th Fr Sa Su │ │Mo Tu We Th Fr Sa Su │       │
│ ├─────────────────────┤ ├─────────────────────┤       │
│ │ 1  2  3  4  5  6  7 │ │ 1  2  3  4  5  6  7 │       │
│ │ 8  9 10 11[12]13 14 │ │ 8  9 10 11 12 13 14 │       │
│ │15 16 17 18 19 20 21 │ │15 16 17 18 19 20 21 │       │
│ └─────────────────────┘ └─────────────────────┘       │
│                                                        │
│ [Green = Open] [Red = Blackout] [Yellow = Booked]    │
│                                                        │
└────────────────────────────────────────────────────────┘
```

#### Slot Management:
- **Click/Drag to set:** 09:00-13:00, 14:00-18:00 (e.g., 4-hour blocks)
- **Color codes:**
  - 🟢 Green = Open/Available
  - 🔴 Red = Blackout (blocked)
  - 🟡 Yellow = Booked (locked by order)

#### Bulk Actions:
```
┌────────────────────────────────┐
│ Bulk Actions                   │
├────────────────────────────────┤
│ [Repeat Weekly Pattern]        │
│   Apply this week's pattern to │
│   all future months            │
│                                │
│ [Copy Month]                   │
│   Copy Nov 2025 to Dec 2025    │
│                                │
│ [Clear Month]                  │
│   Remove all slots from month  │
│                                │
│ [Blackout All]                 │
│   Set entire month as blocked  │
└────────────────────────────────┘
```

#### Database Table:
```sql
CREATE TABLE calendar_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status TEXT CHECK (status IN ('open', 'blackout', 'booked')),
  booked_by_order_id UUID REFERENCES orders(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(date, start_time, end_time)
);
```

---

## 5️⃣ Component Structure

```
src/
├── pages/
│   ├── Admin.tsx                    (router for all admin pages)
│   ├── AdminDashboard.tsx
│   ├── AdminOrders.tsx
│   ├── AdminInvoices.tsx
│   └── AdminCalendar.tsx
│
├── components/
│   └── admin/
│       ├── AdminLayout.tsx          (sidebar + navigation)
│       ├── AdminNav.tsx
│       │
│       ├── orders/
│       │   ├── OrdersTable.tsx
│       │   ├── OrderDetailPanel.tsx
│       │   ├── StatusChangeDropdown.tsx
│       │   ├── SlotAssignmentModal.tsx
│       │   └── DeliverablesUpload.tsx
│       │
│       ├── invoices/
│       │   ├── InvoicesTable.tsx
│       │   ├── InvoiceForm.tsx
│       │   └── PDFUploadZone.tsx
│       │
│       ├── calendar/
│       │   ├── CalendarGrid.tsx
│       │   ├── CalendarControls.tsx
│       │   ├── SlotEditor.tsx
│       │   └── BulkActionsPanel.tsx
│       │
│       └── shared/
│           ├── AdminStats.tsx
│           ├── ActivityLog.tsx
│           └── ClientMessaging.tsx
```

---

## 🔗 API Routes Needed

### Orders:
```
GET /api/admin/orders                 (list all)
GET /api/admin/orders/:id             (detail)
PATCH /api/admin/orders/:id           (update status)
POST /api/admin/orders/:id/slot       (assign slot)
DELETE /api/admin/orders/:id/slot     (unassign slot)
POST /api/admin/orders/:id/deliverable (upload file)
POST /api/admin/orders/:id/message    (send message)
```

### Invoices:
```
GET /api/admin/invoices               (list all)
POST /api/admin/invoices              (create from order)
PATCH /api/admin/invoices/:id         (update payment status)
POST /api/admin/invoices/:id/pdf      (upload PDF)
GET /api/admin/invoices/:id/download  (download PDF)
```

### Calendar:
```
GET /api/admin/calendar/slots         (get all slots for date range)
POST /api/admin/calendar/slots        (create slots)
PATCH /api/admin/calendar/slots/:id   (update slot)
DELETE /api/admin/calendar/slots/:id  (delete slot)
POST /api/admin/calendar/bulk-actions (repeat/copy/clear operations)
```

---

## 🗄️ Database Migrations Needed

```
1. Add admin role to users table
2. Create admin_settings table
3. Create admin_activity_log table
4. Create calendar_slots table
5. Create invoice_pdfs table (for storing PDF paths/metadata)
6. Update RLS policies for admin access
```

---

## 🔐 Security Considerations

1. **Role-Based Access Control:**
   - Only admins can access /admin/* routes
   - Middleware to check role before rendering

2. **RLS Policies:**
   - Admins can view all orders/invoices
   - Clients can only view their own

3. **Audit Logging:**
   - Log all admin actions (status changes, invoice creation, etc.)
   - Keep immutable change history

4. **Email Verification:**
   - Admin email config stored securely
   - Test email sending before saving

---

## 📱 UI/UX Guidelines

1. **Layout:**
   - Similar to client dashboard but with more admin controls
   - Dark sidebar with admin-specific navigation
   - Breadcrumb navigation for clarity

2. **Tables:**
   - Sortable columns
   - Filterable by status, date, client
   - Pagination for large lists
   - Quick actions (edit, delete, etc.)

3. **Forms:**
   - Validation on client and server side
   - Clear error messages
   - Success toasts after actions

4. **Modals/Drawers:**
   - Slide-out panels for detailed views
   - Modal confirmations for destructive actions

---

## 🚀 Implementation Steps

### Phase 1: Foundation
1. Add admin role to database
2. Create admin authentication middleware
3. Create AdminLayout component
4. Add /admin routes to App.tsx

### Phase 2: Dashboard
1. Create AdminDashboard page
2. Build stats components
3. Add recent orders list

### Phase 3: Orders Management
1. Build OrdersTable component
2. Create OrderDetailPanel
3. Add status change functionality
4. Implement slot assignment

### Phase 4: Calendar
1. Create calendar grid component
2. Add slot management UI
3. Implement bulk actions

### Phase 5: Invoices
1. Build InvoicesTable
2. Create invoice form
3. Add PDF upload
4. Implement payment status tracking

### Phase 6: Polish
1. Add email notifications
2. Implement audit logging
3. Test RLS policies
4. Performance optimization

---

## ⏱️ Time Estimate

- Phase 1: 1-2 hours
- Phase 2: 2-3 hours
- Phase 3: 3-4 hours
- Phase 4: 3-4 hours
- Phase 5: 2-3 hours
- Phase 6: 2-3 hours

**Total: 13-19 hours** (depending on complexity and testing)

---

## ✅ Success Criteria

- [ ] Admins can log in and see admin dashboard
- [ ] All orders visible with full details
- [ ] Status changes trigger correct emails
- [ ] Calendar slots assignable and locked
- [ ] Invoices creatable with sequential numbering
- [ ] All admin actions logged
- [ ] No client can access admin pages
- [ ] Responsive on all devices
- [ ] Performance acceptable (<2s load times)
- [ ] All edge cases handled

---

**Next Step:** Choose which phase to start with, or ask for clarification on any requirements!
