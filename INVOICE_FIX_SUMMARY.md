# Invoice Column Name Fix - Summary

## Issue
The error **"column invoices.issue_date does not exist"** was occurring on the invoice page. This was caused by inconsistencies between the database schema and the frontend code accessing those columns.

## Root Cause
The Supabase database migration (`20251102000000_create_admin_infrastructure.sql`) created the invoices table with columns:
- `issue_date` (DATE)
- `due_date` (DATE)  
- `amount_incl_vat` (DECIMAL)
- `payment_status` (TEXT)

However, multiple frontend components and type definitions were using incorrect column names:
- `issued_at` instead of `issue_date`
- `due_at` instead of `due_date`

## Files Fixed

### 1. **src/components/invoices/InvoicesList.tsx**
- **Line 99-100**: Changed `invoice.issued_at` → `invoice.issue_date`
- **Line 100**: Changed `invoice.due_at` → `invoice.due_date`

### 2. **src/components/admin/invoices/CreateInvoiceForm.tsx**
- **Line 151**: Changed `issued_at: issueDate` → `issue_date: issueDate`
- **Line 152**: Changed `due_at: dueDate` → `due_date: dueDate`

### 3. **src/pages/OrderDetail.tsx**
- **Line 350**: Changed `invoice.issued_at` → `invoice.issue_date`

### 4. **src/integrations/supabase/types.ts**
Updated the complete invoices table schema definition to match the actual database:

**Before:**
```typescript
invoices: {
  Row: {
    issued_at: string | null
    due_at: string
    status: string | null
    total_amount: number
    // missing: amount_incl_vat, payment_status, etc.
  }
}
```

**After:**
```typescript
invoices: {
  Row: {
    issue_date: string
    due_date: string
    amount_incl_vat: number
    payment_status: string
    pdf_path: string | null
    pdf_uploaded_at: string | null
    notes: string | null
    created_by: string
    // all correct columns
  }
}
```

## Changes Summary
- ✅ Fixed 4 component/type files
- ✅ Changed 5 incorrect column references
- ✅ Updated TypeScript type definitions to match database schema
- ✅ No linting errors
- ✅ All invoice functionality now properly aligned with database schema

## Testing
The invoice page should now:
- ✅ Display invoices without errors
- ✅ Show correct issue dates and due dates
- ✅ Access the correct database columns
- ✅ Properly display payment status and amounts

## Database Schema Reference
The invoices table columns (from migration `20251102000000_create_admin_infrastructure.sql`):
- `id` (UUID PRIMARY KEY)
- `order_id` (UUID FK)
- `invoice_number` (TEXT UNIQUE)
- `issue_date` (DATE) - NOT `issued_at`
- `due_date` (DATE) - NOT `due_at`
- `amount_excl_vat` (DECIMAL)
- `vat_amount` (DECIMAL)
- `amount_incl_vat` (DECIMAL)
- `payment_status` (TEXT: 'unpaid', 'partial', 'paid')
- `pdf_path` (TEXT)
- `pdf_uploaded_at` (TIMESTAMP)
- `notes` (TEXT)
- `created_by` (UUID FK)
- `created_at`, `updated_at` (TIMESTAMP)
