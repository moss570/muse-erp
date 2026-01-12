
-- =============================================
-- PHASE 1: INVENTORY FOUNDATION - Core Tables
-- =============================================

-- 1.1 Inventory Transactions Table (tracks ALL inventory movements)
CREATE TABLE IF NOT EXISTS public.inventory_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('receipt', 'issue', 'transfer', 'adjustment', 'disassembly', 'production_consume', 'production_output')),
  material_id UUID REFERENCES public.materials(id),
  product_id UUID REFERENCES public.products(id),
  receiving_lot_id UUID REFERENCES public.receiving_lots(id),
  production_lot_id UUID REFERENCES public.production_lots(id),
  from_location_id UUID REFERENCES public.locations(id),
  to_location_id UUID REFERENCES public.locations(id),
  quantity NUMERIC NOT NULL,
  unit_id UUID REFERENCES public.units_of_measure(id),
  reference_type TEXT,
  reference_id UUID,
  reason_code TEXT,
  notes TEXT,
  performed_by UUID REFERENCES public.profiles(id),
  approved_by UUID REFERENCES public.profiles(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for inventory_transactions
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'inventory_transactions' AND policyname = 'Users can view inventory transactions') THEN
    CREATE POLICY "Users can view inventory transactions"
      ON public.inventory_transactions FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'inventory_transactions' AND policyname = 'Authenticated users can create inventory transactions') THEN
    CREATE POLICY "Authenticated users can create inventory transactions"
      ON public.inventory_transactions FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'inventory_transactions' AND policyname = 'Authenticated users can update inventory transactions') THEN
    CREATE POLICY "Authenticated users can update inventory transactions"
      ON public.inventory_transactions FOR UPDATE USING (auth.uid() IS NOT NULL);
  END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_material ON public.inventory_transactions(material_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_lot ON public.inventory_transactions(receiving_lot_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_location ON public.inventory_transactions(to_location_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_type ON public.inventory_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_created ON public.inventory_transactions(created_at DESC);

-- 1.2 Inventory Movements Table
CREATE TABLE IF NOT EXISTS public.inventory_movements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('transfer', 'issue_to_production', 'return_to_warehouse', '3pl_shipment', '3pl_receipt')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  source_location_id UUID NOT NULL REFERENCES public.locations(id),
  destination_location_id UUID NOT NULL REFERENCES public.locations(id),
  requested_by UUID REFERENCES public.profiles(id),
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_by UUID REFERENCES public.profiles(id),
  completed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Movement line items
CREATE TABLE IF NOT EXISTS public.inventory_movement_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  movement_id UUID NOT NULL REFERENCES public.inventory_movements(id) ON DELETE CASCADE,
  material_id UUID REFERENCES public.materials(id),
  product_id UUID REFERENCES public.products(id),
  receiving_lot_id UUID REFERENCES public.receiving_lots(id),
  production_lot_id UUID REFERENCES public.production_lots(id),
  quantity_requested NUMERIC NOT NULL,
  quantity_moved NUMERIC,
  unit_id UUID NOT NULL REFERENCES public.units_of_measure(id),
  scanned_verified BOOLEAN DEFAULT false,
  scanned_at TIMESTAMP WITH TIME ZONE,
  scanned_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movement_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'inventory_movements' AND policyname = 'Users can view inventory movements') THEN
    CREATE POLICY "Users can view inventory movements"
      ON public.inventory_movements FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'inventory_movements' AND policyname = 'Authenticated users can manage inventory movements') THEN
    CREATE POLICY "Authenticated users can manage inventory movements"
      ON public.inventory_movements FOR ALL USING (auth.uid() IS NOT NULL);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'inventory_movement_items' AND policyname = 'Users can view movement items') THEN
    CREATE POLICY "Users can view movement items"
      ON public.inventory_movement_items FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'inventory_movement_items' AND policyname = 'Authenticated users can manage movement items') THEN
    CREATE POLICY "Authenticated users can manage movement items"
      ON public.inventory_movement_items FOR ALL USING (auth.uid() IS NOT NULL);
  END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_movements_status ON public.inventory_movements(status);
CREATE INDEX IF NOT EXISTS idx_movements_source ON public.inventory_movements(source_location_id);
CREATE INDEX IF NOT EXISTS idx_movements_dest ON public.inventory_movements(destination_location_id);
CREATE INDEX IF NOT EXISTS idx_movement_items_movement ON public.inventory_movement_items(movement_id);
CREATE INDEX IF NOT EXISTS idx_movement_items_lot ON public.inventory_movement_items(receiving_lot_id);

-- 1.5 Inventory Adjustments Table
CREATE TABLE IF NOT EXISTS public.inventory_adjustments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  receiving_lot_id UUID REFERENCES public.receiving_lots(id),
  production_lot_id UUID REFERENCES public.production_lots(id),
  disassembly_record_id UUID REFERENCES public.disassembly_records(id),
  location_id UUID NOT NULL REFERENCES public.locations(id),
  adjustment_type TEXT NOT NULL CHECK (adjustment_type IN ('increase', 'decrease', 'write_off')),
  reason_code TEXT NOT NULL,
  quantity_before NUMERIC NOT NULL,
  quantity_adjusted NUMERIC NOT NULL,
  quantity_after NUMERIC NOT NULL,
  unit_id UUID NOT NULL REFERENCES public.units_of_measure(id),
  notes TEXT,
  requires_approval BOOLEAN DEFAULT false,
  approval_status TEXT DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
  adjusted_by UUID REFERENCES public.profiles(id),
  approved_by UUID REFERENCES public.profiles(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.inventory_adjustments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'inventory_adjustments' AND policyname = 'Users can view inventory adjustments') THEN
    CREATE POLICY "Users can view inventory adjustments"
      ON public.inventory_adjustments FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'inventory_adjustments' AND policyname = 'Authenticated users can create inventory adjustments') THEN
    CREATE POLICY "Authenticated users can create inventory adjustments"
      ON public.inventory_adjustments FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'inventory_adjustments' AND policyname = 'Authenticated users can update inventory adjustments') THEN
    CREATE POLICY "Authenticated users can update inventory adjustments"
      ON public.inventory_adjustments FOR UPDATE USING (auth.uid() IS NOT NULL);
  END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_adjustments_lot ON public.inventory_adjustments(receiving_lot_id);
CREATE INDEX IF NOT EXISTS idx_adjustments_location ON public.inventory_adjustments(location_id);
CREATE INDEX IF NOT EXISTS idx_adjustments_status ON public.inventory_adjustments(approval_status);
