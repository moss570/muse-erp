-- Create quality_test_templates table
CREATE TABLE public.quality_test_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_name TEXT NOT NULL,
  test_code TEXT UNIQUE NOT NULL,
  description TEXT,
  category TEXT, -- 'microbiological', 'physical', 'chemical', 'sensory', 'safety'
  test_method TEXT, -- detailed procedure/protocol
  parameter_type TEXT NOT NULL, -- 'numeric', 'pass_fail', 'text', 'range'
  target_value TEXT,
  min_value NUMERIC,
  max_value NUMERIC,
  uom TEXT, -- unit of measure
  required_equipment TEXT,
  typical_duration_minutes INTEGER,
  applicable_stages TEXT[], -- array: 'base', 'flavoring', 'finished'
  is_critical BOOLEAN DEFAULT false, -- is this a CCP (Critical Control Point)?
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES public.profiles(id)
);

CREATE INDEX idx_quality_test_templates_category ON public.quality_test_templates(category);
CREATE INDEX idx_quality_test_templates_active ON public.quality_test_templates(is_active);

-- RLS Policies for quality_test_templates
ALTER TABLE public.quality_test_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view test templates"
  ON public.quality_test_templates FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Managers can insert test templates"
  ON public.quality_test_templates FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin_or_manager(auth.uid()));

CREATE POLICY "Managers can update test templates"
  ON public.quality_test_templates FOR UPDATE
  TO authenticated
  USING (public.is_admin_or_manager(auth.uid()));

CREATE POLICY "Managers can delete test templates"
  ON public.quality_test_templates FOR DELETE
  TO authenticated
  USING (public.is_admin_or_manager(auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_quality_test_templates_updated_at
  BEFORE UPDATE ON public.quality_test_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create production_lot_qa_tests table
CREATE TABLE public.production_lot_qa_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  production_lot_id UUID NOT NULL REFERENCES public.production_lots(id) ON DELETE CASCADE,
  test_template_id UUID REFERENCES public.quality_test_templates(id),
  -- Can also be ad-hoc tests not from template
  test_name TEXT NOT NULL,
  parameter_type TEXT NOT NULL,
  
  -- Test Results
  test_value_numeric NUMERIC,
  test_value_text TEXT,
  passed BOOLEAN, -- overall pass/fail for this test
  out_of_spec BOOLEAN DEFAULT false,
  
  -- Test Metadata
  tested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  tested_by UUID REFERENCES public.profiles(id),
  verified_by UUID REFERENCES public.profiles(id), -- QA manager verification
  verified_at TIMESTAMPTZ,
  
  -- Expected values (copied from template or product requirement)
  target_value TEXT,
  min_value NUMERIC,
  max_value NUMERIC,
  uom TEXT,
  
  -- Documentation
  notes TEXT,
  corrective_action TEXT, -- if out of spec
  photo_urls TEXT[], -- array of image URLs
  document_urls TEXT[], -- array of document URLs (PDFs, etc.)
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_production_lot_qa_tests_lot ON public.production_lot_qa_tests(production_lot_id);
CREATE INDEX idx_production_lot_qa_tests_template ON public.production_lot_qa_tests(test_template_id);
CREATE INDEX idx_production_lot_qa_tests_tested_at ON public.production_lot_qa_tests(tested_at);
CREATE INDEX idx_production_lot_qa_tests_passed ON public.production_lot_qa_tests(passed);

-- RLS Policies for production_lot_qa_tests
ALTER TABLE public.production_lot_qa_tests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view QA tests"
  ON public.production_lot_qa_tests FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Production users can create QA tests"
  ON public.production_lot_qa_tests FOR INSERT
  TO authenticated WITH CHECK (true);

CREATE POLICY "Users can update their own QA tests or managers"
  ON public.production_lot_qa_tests FOR UPDATE
  TO authenticated
  USING (tested_by = auth.uid() OR public.is_admin_or_manager(auth.uid()));

CREATE POLICY "Managers can delete QA tests"
  ON public.production_lot_qa_tests FOR DELETE
  TO authenticated
  USING (public.is_admin_or_manager(auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_production_lot_qa_tests_updated_at
  BEFORE UPDATE ON public.production_lot_qa_tests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Extend product_qa_requirements table
ALTER TABLE public.product_qa_requirements 
  ADD COLUMN IF NOT EXISTS test_template_id UUID REFERENCES public.quality_test_templates(id),
  ADD COLUMN IF NOT EXISTS frequency TEXT, -- 'per_batch', 'hourly', 'daily', 'weekly'
  ADD COLUMN IF NOT EXISTS sample_size TEXT; -- how many samples to test

-- Create qa-test-evidence storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('qa-test-evidence', 'qa-test-evidence', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for qa-test-evidence bucket
CREATE POLICY "Public read access for qa-test-evidence"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'qa-test-evidence');

CREATE POLICY "Authenticated users can upload qa-test-evidence"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'qa-test-evidence');

CREATE POLICY "Authenticated users can update their qa-test-evidence"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'qa-test-evidence');

CREATE POLICY "Managers can delete qa-test-evidence"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'qa-test-evidence' AND public.is_admin_or_manager(auth.uid()));