-- Fix the order number generation to use sequences (atomic, no race conditions)

-- Create sequence for order numbers if it doesn't exist
CREATE SEQUENCE IF NOT EXISTS order_number_seq START WITH 1 INCREMENT BY 1;

-- Create sequence for invoice numbers if it doesn't exist  
CREATE SEQUENCE IF NOT EXISTS invoice_number_seq START WITH 1 INCREMENT BY 1;

-- Drop the old functions
DROP FUNCTION IF EXISTS generate_order_number() CASCADE;
DROP FUNCTION IF EXISTS generate_invoice_number() CASCADE;

-- Recreate order number function using sequence
CREATE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
  next_number INTEGER;
  formatted_number TEXT;
BEGIN
  -- Use sequence to get atomic incrementing number
  next_number := nextval('order_number_seq');
  
  -- Format as IM-000001, IM-000002, etc.
  formatted_number := 'IM-' || LPAD(next_number::TEXT, 6, '0');
  
  RETURN formatted_number;
END;
$$ LANGUAGE plpgsql;

-- Recreate invoice number function using sequence
CREATE FUNCTION generate_invoice_number()
RETURNS TEXT AS $$
DECLARE
  current_year TEXT;
  next_number INTEGER;
  formatted_number TEXT;
BEGIN
  -- Get current year
  current_year := TO_CHAR(CURRENT_DATE, 'YYYY');
  
  -- Use sequence to get atomic incrementing number
  next_number := nextval('invoice_number_seq');
  
  -- Format as INV-YYYY-000001, INV-YYYY-000002, etc.
  formatted_number := 'INV-' || current_year || '-' || LPAD(next_number::TEXT, 6, '0');
  
  RETURN formatted_number;
END;
$$ LANGUAGE plpgsql;
