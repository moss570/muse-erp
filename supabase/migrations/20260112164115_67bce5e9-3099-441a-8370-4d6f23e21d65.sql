
-- Create view for inventory by lot/location
CREATE OR REPLACE VIEW public.inventory_by_lot_location AS
SELECT 
  rl.id as receiving_lot_id,
  rl.internal_lot_number,
  rl.supplier_lot_number,
  rl.material_id,
  m.name as material_name,
  m.code as material_code,
  rl.expiry_date,
  COALESCE(rl.current_location_id, rl.location_id) as location_id,
  l.name as location_name,
  COALESCE(rl.current_quantity, rl.quantity_received) as current_quantity,
  rl.container_status,
  rl.quantity_received as original_quantity,
  u.code as unit_code,
  u.name as unit_name,
  CASE 
    WHEN rl.expiry_date IS NULL THEN 'no_expiry'
    WHEN rl.expiry_date < CURRENT_DATE THEN 'expired'
    WHEN rl.expiry_date < CURRENT_DATE + INTERVAL '30 days' THEN 'expiring_soon'
    ELSE 'good'
  END as expiry_status
FROM public.receiving_lots rl
LEFT JOIN public.materials m ON rl.material_id = m.id
LEFT JOIN public.locations l ON COALESCE(rl.current_location_id, rl.location_id) = l.id
LEFT JOIN public.units_of_measure u ON m.base_unit_id = u.id
WHERE COALESCE(rl.current_quantity, rl.quantity_received) > 0;

-- Trigger function for updating lot quantities
CREATE OR REPLACE FUNCTION public.update_lot_quantity_on_transaction()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.receiving_lot_id IS NOT NULL THEN
    IF NEW.transaction_type IN ('receipt', 'adjustment', 'return_to_warehouse') THEN
      UPDATE public.receiving_lots SET 
        current_quantity = COALESCE(current_quantity, quantity_received) + NEW.quantity,
        current_location_id = COALESCE(NEW.to_location_id, current_location_id, location_id),
        last_transaction_at = now()
      WHERE id = NEW.receiving_lot_id;
    ELSIF NEW.transaction_type IN ('issue', 'transfer', 'production_consume', 'disassembly') THEN
      UPDATE public.receiving_lots SET 
        current_quantity = COALESCE(current_quantity, quantity_received) - NEW.quantity,
        last_transaction_at = now()
      WHERE id = NEW.receiving_lot_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_update_lot_quantity ON public.inventory_transactions;
CREATE TRIGGER trigger_update_lot_quantity
  AFTER INSERT ON public.inventory_transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_lot_quantity_on_transaction();
