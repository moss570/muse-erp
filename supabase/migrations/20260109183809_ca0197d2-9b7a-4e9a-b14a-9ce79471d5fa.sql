-- Create material_suppliers linking table
CREATE TABLE public.material_suppliers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  material_id UUID NOT NULL REFERENCES public.materials(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT false,
  supplier_item_number TEXT,
  cost_per_unit NUMERIC,
  unit_id UUID REFERENCES public.units_of_measure(id),
  lead_time_days INTEGER,
  min_order_quantity NUMERIC,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(material_id, supplier_id)
);

-- Enable RLS
ALTER TABLE public.material_suppliers ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Material suppliers viewable by authenticated"
ON public.material_suppliers FOR SELECT
USING (true);

CREATE POLICY "Admins and managers can manage material suppliers"
ON public.material_suppliers FOR ALL
USING (is_admin_or_manager(auth.uid()))
WITH CHECK (is_admin_or_manager(auth.uid()));