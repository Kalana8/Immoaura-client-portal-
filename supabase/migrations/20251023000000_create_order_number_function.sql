-- Create function to generate sequential order numbers in IM-000001 format
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
  next_number INTEGER;
  formatted_number TEXT;
BEGIN
  -- Get the last order number and extract the numeric part
  SELECT COALESCE(MAX(
    CAST(
      SUBSTRING(order_number FROM 4) AS INTEGER
    )
  ), 0) + 1
  INTO next_number
  FROM orders
  WHERE order_number ~ '^IM-[0-9]+$';
  
  -- Format as IM-000001, IM-000002, etc.
  formatted_number := 'IM-' || LPAD(next_number::TEXT, 6, '0');
  
  RETURN formatted_number;
END;
$$ LANGUAGE plpgsql;

-- Create function to generate sequential invoice numbers in INV-YYYY-000001 format
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TEXT AS $$
DECLARE
  current_year TEXT;
  next_number INTEGER;
  formatted_number TEXT;
BEGIN
  -- Get current year
  current_year := TO_CHAR(CURRENT_DATE, 'YYYY');
  
  -- Get the last invoice number for this year and extract the numeric part
  SELECT COALESCE(MAX(
    CAST(
      SUBSTRING(invoice_number FROM 9) AS INTEGER
    )
  ), 0) + 1
  INTO next_number
  FROM invoices
  WHERE invoice_number ~ ('^INV-' || current_year || '-[0-9]+$');
  
  -- Format as INV-YYYY-000001, INV-YYYY-000002, etc.
  formatted_number := 'INV-' || current_year || '-' || LPAD(next_number::TEXT, 6, '0');
  
  RETURN formatted_number;
END;
$$ LANGUAGE plpgsql;

