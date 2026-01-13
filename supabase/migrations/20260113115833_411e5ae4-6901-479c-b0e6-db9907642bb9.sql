-- Create packaging indicator mappings table
CREATE TABLE public.packaging_indicator_mappings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  case_pack_size INTEGER NOT NULL UNIQUE,
  indicator_digit CHAR(1) NOT NULL CHECK (indicator_digit ~ '^[0-9]$'),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add comment
COMMENT ON TABLE public.packaging_indicator_mappings IS 'Maps case pack sizes to GTIN-14 packaging indicator digits';

-- Enable RLS
ALTER TABLE public.packaging_indicator_mappings ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read
CREATE POLICY "Authenticated users can read packaging indicators"
ON public.packaging_indicator_mappings
FOR SELECT
TO authenticated
USING (true);

-- Only admins/managers can modify
CREATE POLICY "Admins and managers can manage packaging indicators"
ON public.packaging_indicator_mappings
FOR ALL
TO authenticated
USING (public.is_admin_or_manager(auth.uid()))
WITH CHECK (public.is_admin_or_manager(auth.uid()));

-- Add updated_at trigger
CREATE TRIGGER update_packaging_indicator_mappings_updated_at
BEFORE UPDATE ON public.packaging_indicator_mappings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

-- Insert common defaults
INSERT INTO public.packaging_indicator_mappings (case_pack_size, indicator_digit, description) VALUES
(1, '1', 'Single unit'),
(2, '2', 'Two-pack'),
(4, '4', 'Four-pack'),
(8, '8', 'Eight-pack'),
(24, '3', 'Twenty-four pack');

-- Remove the default_packaging_indicator from company_settings since we now use mappings
ALTER TABLE public.company_settings DROP COLUMN IF EXISTS default_packaging_indicator;