
-- =============================================
-- PHASE 1.3: Disassembly Records Table
-- =============================================

-- 1.3 Disassembly Records Table (for UOM conversions - opening bulk containers)
CREATE TABLE public.disassembly_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_receiving_lot_id UUID NOT NULL REFERENCES public.receiving_lots(id),
  material_id UUID NOT NULL REFERENCES public.materials(id),
  location_id UUID NOT NULL REFERENCES public.locations(id),
  original_purchase_unit_id UUID NOT NULL REFERENCES public.material_purchase_units(id),
  original_quantity NUMERIC NOT NULL,
  converted_unit_id UUID NOT NULL REFERENCES public.units_of_measure(id),
  converted_quantity NUMERIC NOT NULL,
  conversion_factor NUMERIC NOT NULL,
  remaining_quantity NUMERIC NOT NULL,
  container_status TEXT NOT NULL DEFAULT 'open' CHECK (container_status IN ('open', 'empty', 'disposed')),
  opened_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  opened_by UUID REFERENCES public.profiles(id),
  emptied_at TIMESTAMP WITH TIME ZONE,
  emptied_by UUID REFERENCES public.profiles(id),
  label_printed BOOLEAN DEFAULT false,
  label_printed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.disassembly_records ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view disassembly records"
  ON public.disassembly_records FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage disassembly records"
  ON public.disassembly_records FOR ALL
  USING (auth.uid() IS NOT NULL);

-- Indexes
CREATE INDEX idx_disassembly_parent_lot ON public.disassembly_records(parent_receiving_lot_id);
CREATE INDEX idx_disassembly_material ON public.disassembly_records(material_id);
CREATE INDEX idx_disassembly_location ON public.disassembly_records(location_id);
CREATE INDEX idx_disassembly_status ON public.disassembly_records(container_status);

-- Trigger for updated_at
CREATE TRIGGER update_disassembly_records_updated_at
  BEFORE UPDATE ON public.disassembly_records
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
