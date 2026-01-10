-- Update the PO number generation function to use format: PO-YY-MMDD-###
CREATE OR REPLACE FUNCTION public.generate_po_number(p_order_date date DEFAULT CURRENT_DATE)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_sequence integer;
BEGIN
  -- Get next sequence number for this date
  -- Handle both old format (PO-YYYYMMDD-###) and new format (PO-YY-MMDD-###)
  SELECT COALESCE(MAX(
    CASE 
      WHEN po_number LIKE 'PO-__-____-___' THEN CAST(SPLIT_PART(po_number, '-', 4) AS integer)
      ELSE CAST(SPLIT_PART(po_number, '-', 3) AS integer)
    END
  ), 0) + 1 
  INTO v_sequence
  FROM public.purchase_orders 
  WHERE order_date = p_order_date;
  
  -- New format: PO-YY-MMDD-###
  RETURN 'PO-' || to_char(p_order_date, 'YY') || '-' || to_char(p_order_date, 'MMDD') || '-' || lpad(v_sequence::text, 3, '0');
END;
$function$;