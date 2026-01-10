-- Fix remaining overly permissive RLS policies

-- ============================================
-- PURCHASE ORDER ITEMS TABLE
-- ============================================
DROP POLICY IF EXISTS "Authenticated users can insert purchase_order_items" ON public.purchase_order_items;
DROP POLICY IF EXISTS "Authenticated users can update purchase_order_items" ON public.purchase_order_items;
DROP POLICY IF EXISTS "Authenticated users can delete purchase_order_items" ON public.purchase_order_items;

-- Supervisors and above can insert PO items
CREATE POLICY "Supervisors can insert purchase_order_items" 
ON public.purchase_order_items FOR INSERT 
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'manager') OR 
  public.has_role(auth.uid(), 'supervisor')
);

-- Supervisors and above can update PO items
CREATE POLICY "Supervisors can update purchase_order_items" 
ON public.purchase_order_items FOR UPDATE 
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'manager') OR 
  public.has_role(auth.uid(), 'supervisor')
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'manager') OR 
  public.has_role(auth.uid(), 'supervisor')
);

-- Only admins can delete PO items
CREATE POLICY "Admins can delete purchase_order_items" 
ON public.purchase_order_items FOR DELETE 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- PO RECEIVING SESSIONS TABLE
-- ============================================
DROP POLICY IF EXISTS "Authenticated users can insert po_receiving_sessions" ON public.po_receiving_sessions;
DROP POLICY IF EXISTS "Authenticated users can update po_receiving_sessions" ON public.po_receiving_sessions;
DROP POLICY IF EXISTS "Authenticated users can delete po_receiving_sessions" ON public.po_receiving_sessions;

-- Supervisors and above can insert receiving sessions
CREATE POLICY "Supervisors can insert po_receiving_sessions" 
ON public.po_receiving_sessions FOR INSERT 
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'manager') OR 
  public.has_role(auth.uid(), 'supervisor')
);

-- Supervisors and above can update receiving sessions
CREATE POLICY "Supervisors can update po_receiving_sessions" 
ON public.po_receiving_sessions FOR UPDATE 
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'manager') OR 
  public.has_role(auth.uid(), 'supervisor')
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'manager') OR 
  public.has_role(auth.uid(), 'supervisor')
);

-- Only admins can delete receiving sessions
CREATE POLICY "Admins can delete po_receiving_sessions" 
ON public.po_receiving_sessions FOR DELETE 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- PO RECEIVING ITEMS TABLE
-- ============================================
DROP POLICY IF EXISTS "Authenticated users can insert po_receiving_items" ON public.po_receiving_items;
DROP POLICY IF EXISTS "Authenticated users can update po_receiving_items" ON public.po_receiving_items;
DROP POLICY IF EXISTS "Authenticated users can delete po_receiving_items" ON public.po_receiving_items;

-- Supervisors and above can insert receiving items
CREATE POLICY "Supervisors can insert po_receiving_items" 
ON public.po_receiving_items FOR INSERT 
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'manager') OR 
  public.has_role(auth.uid(), 'supervisor')
);

-- Supervisors and above can update receiving items
CREATE POLICY "Supervisors can update po_receiving_items" 
ON public.po_receiving_items FOR UPDATE 
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'manager') OR 
  public.has_role(auth.uid(), 'supervisor')
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'manager') OR 
  public.has_role(auth.uid(), 'supervisor')
);

-- Only admins can delete receiving items
CREATE POLICY "Admins can delete po_receiving_items" 
ON public.po_receiving_items FOR DELETE 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- RECEIVING LOTS TABLE
-- ============================================
DROP POLICY IF EXISTS "Authenticated users can insert receiving_lots" ON public.receiving_lots;
DROP POLICY IF EXISTS "Authenticated users can update receiving_lots" ON public.receiving_lots;
DROP POLICY IF EXISTS "Authenticated users can delete receiving_lots" ON public.receiving_lots;

-- Supervisors and above can insert receiving lots
CREATE POLICY "Supervisors can insert receiving_lots" 
ON public.receiving_lots FOR INSERT 
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'manager') OR 
  public.has_role(auth.uid(), 'supervisor')
);

-- Supervisors and above can update receiving lots
CREATE POLICY "Supervisors can update receiving_lots" 
ON public.receiving_lots FOR UPDATE 
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'manager') OR 
  public.has_role(auth.uid(), 'supervisor')
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'manager') OR 
  public.has_role(auth.uid(), 'supervisor')
);

-- Only admins can delete receiving lots
CREATE POLICY "Admins can delete receiving_lots" 
ON public.receiving_lots FOR DELETE 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- INVOICES TABLE
-- ============================================
DROP POLICY IF EXISTS "Authenticated users can insert purchase_order_invoices" ON public.purchase_order_invoices;
DROP POLICY IF EXISTS "Authenticated users can update purchase_order_invoices" ON public.purchase_order_invoices;
DROP POLICY IF EXISTS "Authenticated users can delete purchase_order_invoices" ON public.purchase_order_invoices;

-- Managers and above can insert invoices
CREATE POLICY "Managers can insert purchase_order_invoices" 
ON public.purchase_order_invoices FOR INSERT 
TO authenticated
WITH CHECK (public.is_admin_or_manager(auth.uid()));

-- Managers and above can update invoices
CREATE POLICY "Managers can update purchase_order_invoices" 
ON public.purchase_order_invoices FOR UPDATE 
TO authenticated
USING (public.is_admin_or_manager(auth.uid()))
WITH CHECK (public.is_admin_or_manager(auth.uid()));

-- Only admins can delete invoices
CREATE POLICY "Admins can delete purchase_order_invoices" 
ON public.purchase_order_invoices FOR DELETE 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- INVOICE LINE ITEMS TABLE
-- ============================================
DROP POLICY IF EXISTS "Authenticated users can insert invoice_line_items" ON public.invoice_line_items;
DROP POLICY IF EXISTS "Authenticated users can update invoice_line_items" ON public.invoice_line_items;
DROP POLICY IF EXISTS "Authenticated users can delete invoice_line_items" ON public.invoice_line_items;

-- Managers and above can insert invoice line items
CREATE POLICY "Managers can insert invoice_line_items" 
ON public.invoice_line_items FOR INSERT 
TO authenticated
WITH CHECK (public.is_admin_or_manager(auth.uid()));

-- Managers and above can update invoice line items
CREATE POLICY "Managers can update invoice_line_items" 
ON public.invoice_line_items FOR UPDATE 
TO authenticated
USING (public.is_admin_or_manager(auth.uid()))
WITH CHECK (public.is_admin_or_manager(auth.uid()));

-- Only admins can delete invoice line items
CREATE POLICY "Admins can delete invoice_line_items" 
ON public.invoice_line_items FOR DELETE 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));