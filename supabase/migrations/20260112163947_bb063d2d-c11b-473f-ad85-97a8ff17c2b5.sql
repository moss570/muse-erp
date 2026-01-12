
-- Step 1: Add new tracking columns to receiving_lots
ALTER TABLE public.receiving_lots 
  ADD COLUMN IF NOT EXISTS container_status TEXT DEFAULT 'sealed',
  ADD COLUMN IF NOT EXISTS current_quantity NUMERIC,
  ADD COLUMN IF NOT EXISTS current_location_id UUID,
  ADD COLUMN IF NOT EXISTS last_transaction_at TIMESTAMP WITH TIME ZONE;

-- Add foreign key constraint
ALTER TABLE public.receiving_lots
  ADD CONSTRAINT fk_receiving_lots_current_location
  FOREIGN KEY (current_location_id) REFERENCES public.locations(id);

-- Initialize current_quantity and current_location_id for existing lots
UPDATE public.receiving_lots
SET current_quantity = quantity_received,
    current_location_id = location_id
WHERE current_quantity IS NULL;
