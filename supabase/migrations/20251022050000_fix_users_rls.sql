-- Fix RLS policies for users table to allow order creation
-- The issue is that when creating an order, the foreign key constraint
-- on client_id needs to verify the user exists, but RLS blocks this check

-- First, ensure authenticated users have necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON TABLE public.users TO authenticated;
GRANT SELECT ON TABLE public.orders TO authenticated;
GRANT INSERT ON TABLE public.orders TO authenticated;

-- Drop all existing policies on users table
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Admin full access" ON users;
DROP POLICY IF EXISTS "Users can view for FK checks" ON users;

-- Recreate simplified RLS policies
-- Policy 1: Users can SELECT their own row
CREATE POLICY "Users can view own profile"
ON users FOR SELECT
USING (auth.uid() = id);

-- Policy 2: Users can SELECT any row (needed for foreign key checks during order creation)
-- This is necessary because the FK check needs to verify the client_id exists
CREATE POLICY "Users can view for FK checks"
ON users FOR SELECT
TO authenticated
USING (true);

-- Policy 3: Users can UPDATE their own row
CREATE POLICY "Users can update own profile"
ON users FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Policy 4: Users can INSERT their own row (for user registration)
CREATE POLICY "Users can insert own profile"
ON users FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Ensure RLS is enabled on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

