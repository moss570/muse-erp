-- Fix remaining overly permissive RLS policies

-- ============================================
-- COMPANY SETTINGS TABLE - Only admins can update
-- ============================================
DROP POLICY IF EXISTS "Authenticated users can update company settings" ON public.company_settings;

-- Only admins can update company settings
CREATE POLICY "Admins can update company_settings" 
ON public.company_settings FOR UPDATE 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- DOCUMENT TEMPLATES TABLE - Restrict write access
-- ============================================
DROP POLICY IF EXISTS "Authenticated users can create templates" ON public.document_templates;
DROP POLICY IF EXISTS "Authenticated users can update templates" ON public.document_templates;
DROP POLICY IF EXISTS "Authenticated users can delete templates" ON public.document_templates;

-- Managers and above can create templates
CREATE POLICY "Managers can create document_templates" 
ON public.document_templates FOR INSERT 
TO authenticated
WITH CHECK (public.is_admin_or_manager(auth.uid()));

-- Managers and above can update templates
CREATE POLICY "Managers can update document_templates" 
ON public.document_templates FOR UPDATE 
TO authenticated
USING (public.is_admin_or_manager(auth.uid()))
WITH CHECK (public.is_admin_or_manager(auth.uid()));

-- Only admins can delete templates
CREATE POLICY "Admins can delete document_templates" 
ON public.document_templates FOR DELETE 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- LABEL TEMPLATES TABLE - Restrict write access
-- ============================================
DROP POLICY IF EXISTS "Authenticated users can manage label templates" ON public.label_templates;

-- Managers and above can insert label templates
CREATE POLICY "Managers can insert label_templates" 
ON public.label_templates FOR INSERT 
TO authenticated
WITH CHECK (public.is_admin_or_manager(auth.uid()));

-- Managers and above can update label templates
CREATE POLICY "Managers can update label_templates" 
ON public.label_templates FOR UPDATE 
TO authenticated
USING (public.is_admin_or_manager(auth.uid()))
WITH CHECK (public.is_admin_or_manager(auth.uid()));

-- Only admins can delete label templates
CREATE POLICY "Admins can delete label_templates" 
ON public.label_templates FOR DELETE 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));