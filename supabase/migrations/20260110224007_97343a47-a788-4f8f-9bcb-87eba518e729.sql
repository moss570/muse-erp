-- Fix last overly permissive RLS policy

-- ============================================
-- TEMPLATE MERGE FIELDS TABLE - Restrict write access
-- ============================================
DROP POLICY IF EXISTS "Authenticated users can manage merge fields" ON public.template_merge_fields;

-- Managers and above can insert merge fields
CREATE POLICY "Managers can insert template_merge_fields" 
ON public.template_merge_fields FOR INSERT 
TO authenticated
WITH CHECK (public.is_admin_or_manager(auth.uid()));

-- Managers and above can update merge fields
CREATE POLICY "Managers can update template_merge_fields" 
ON public.template_merge_fields FOR UPDATE 
TO authenticated
USING (public.is_admin_or_manager(auth.uid()))
WITH CHECK (public.is_admin_or_manager(auth.uid()));

-- Only admins can delete merge fields
CREATE POLICY "Admins can delete template_merge_fields" 
ON public.template_merge_fields FOR DELETE 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Keep SELECT open for authenticated users (already exists or add if needed)
DROP POLICY IF EXISTS "Anyone can view merge fields" ON public.template_merge_fields;
CREATE POLICY "Authenticated users can view template_merge_fields" 
ON public.template_merge_fields FOR SELECT 
TO authenticated
USING (true);