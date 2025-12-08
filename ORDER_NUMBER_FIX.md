# Fix: Duplicate Order Number Constraint Error

## Problem

When creating new orders, you're seeing this error:
```
duplicate key value violates unique constraint "orders_order_number_key"
```

## Root Cause

**Race Condition in Order Number Generation**

The current `generate_order_number()` function uses `MAX()` which is **not atomic**:

```sql
-- PROBLEMATIC CODE - Can generate duplicates:
SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM 4) AS INTEGER)), 0) + 1
FROM orders
WHERE order_number ~ '^IM-[0-9]+$';
```

**What happens when two users create orders simultaneously:**

```
Time 1: User A calls generate_order_number() 
        → Database looks at existing orders, finds IM-000001
        → Calculates next as IM-000002
        → Returns IM-000002 (but hasn't inserted yet)

Time 2: User B calls generate_order_number() 
        → Database looks at existing orders, STILL only sees IM-000001
        → Calculates next as IM-000002 (SAME NUMBER!)
        → Returns IM-000002

Time 3: User A inserts order with IM-000002 ✅ (succeeds)
Time 4: User B tries to insert order with IM-000002 ❌ (CONSTRAINT VIOLATION)
```

## Solution

The fix has been implemented in the new migration file:
`supabase/migrations/20251101192740_fix_order_number_sequence.sql`

**This migration:**
1. Creates PostgreSQL `SEQUENCE` objects for atomic number generation
2. Replaces the old `MAX()` approach with `nextval()` which is guaranteed to be unique
3. Maintains the same format: `IM-000001`, `IM-000002`, etc.

## How to Apply the Fix

### Option 1: Supabase Web Console (RECOMMENDED)

1. **Log in to Supabase Dashboard**
   - Go to: https://app.supabase.com

2. **Open SQL Editor**
   - Click "SQL Editor" in the left sidebar

3. **Create a new query**
   - Click "New Query" or the "+" button

4. **Copy & Paste the Migration**
   - Open this file: `supabase/migrations/20251101192740_fix_order_number_sequence.sql`
   - Copy the entire contents
   - Paste into the SQL Editor in Supabase

5. **Execute the Query**
   - Click the blue "Run" button (or Cmd+Enter)
   - Wait for completion
   - You should see: "Query successful - X rows affected"

6. **Verify Success**
   - Test creating a new order
   - Order number should now be generated correctly without duplicates

### Option 2: Supabase CLI

If you have the Supabase CLI installed locally:

```bash
cd "/Users/kalanakavinda/Downloads/client portal"
supabase db pull  # Get latest schema
supabase migrate up  # Apply pending migrations
```

## Testing the Fix

After applying the migration:

1. **Create a test order** in the application
2. **Verify order number** is in format `IM-XXXXXX`
3. **Create multiple orders rapidly** (stress test)
   - All should succeed without constraint violations
   - Each order should have a unique, sequential number

## If Orders Already Have Issues

If existing orders have duplicate numbers or need correction:

```sql
-- Check for duplicates
SELECT order_number, COUNT(*) 
FROM orders 
GROUP BY order_number 
HAVING COUNT(*) > 1;

-- Check the highest order number currently used
SELECT MAX(CAST(SUBSTRING(order_number FROM 4) AS INTEGER)) 
FROM orders 
WHERE order_number ~ '^IM-[0-9]+$';
```

If there are duplicates, contact support to manually resolve them, or:

1. Delete the duplicate orders (keep one)
2. Set the sequence starting value to be higher than current max:

```sql
-- Replace X with the highest number currently used
SELECT setval('order_number_seq', X);
```

## Files Modified

- ✅ Created: `supabase/migrations/20251101192740_fix_order_number_sequence.sql`
  - Fixes the race condition by using PostgreSQL sequences
  - Makes number generation atomic and guaranteed unique

## Why This Works

- **PostgreSQL Sequences are atomic:** They guarantee each call returns a unique value
- **No race conditions:** Even with concurrent requests, each gets a different number
- **Same format:** Still generates `IM-000001`, `IM-000002`, etc.
- **Backward compatible:** Existing order data is not affected

## Summary

This fix replaces the vulnerable `MAX()` approach with PostgreSQL's built-in `SEQUENCE` feature, which is specifically designed for this use case and guarantees atomicity even under high concurrency.
