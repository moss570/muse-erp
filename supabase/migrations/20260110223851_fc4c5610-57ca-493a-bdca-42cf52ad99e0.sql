-- Tighten RLS policies to respect role-based permissions
-- This migration updates overly permissive policies (USING true) to proper role-based checks

-- ============================================
-- PROFILES TABLE - Restrict personal info access
-- ============================================
-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Enable update for users based on id" ON public.profiles;

-- Users can view their own profile
CREATE POLICY "Users can view own profile" 
ON public.profiles FOR SELECT 
TO authenticated
USING (auth.uid() = id);

-- Managers and admins can view all profiles
CREATE POLICY "Managers can view all profiles" 
ON public.profiles FOR SELECT 
TO authenticated
USING (public.is_admin_or_manager(auth.uid()));

-- Users can update their own profile
CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE 
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Admins can update any profile
CREATE POLICY "Admins can update all profiles" 
ON public.profiles FOR UPDATE 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- CUSTOMERS TABLE - Restrict sensitive business data
-- ============================================
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.customers;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.customers;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.customers;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.customers;
DROP POLICY IF EXISTS "Authenticated users can view customers" ON public.customers;
DROP POLICY IF EXISTS "Authenticated users can insert customers" ON public.customers;
DROP POLICY IF EXISTS "Authenticated users can update customers" ON public.customers;
DROP POLICY IF EXISTS "Authenticated users can delete customers" ON public.customers;

-- Only managers and admins can view customers
CREATE POLICY "Managers can view customers" 
ON public.customers FOR SELECT 
TO authenticated
USING (public.is_admin_or_manager(auth.uid()));

-- Only managers and admins can insert customers
CREATE POLICY "Managers can insert customers" 
ON public.customers FOR INSERT 
TO authenticated
WITH CHECK (public.is_admin_or_manager(auth.uid()));

-- Only managers and admins can update customers
CREATE POLICY "Managers can update customers" 
ON public.customers FOR UPDATE 
TO authenticated
USING (public.is_admin_or_manager(auth.uid()))
WITH CHECK (public.is_admin_or_manager(auth.uid()));

-- Only admins can delete customers
CREATE POLICY "Admins can delete customers" 
ON public.customers FOR DELETE 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- SUPPLIERS TABLE - Restrict write access
-- ============================================
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.suppliers;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.suppliers;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.suppliers;
DROP POLICY IF EXISTS "Authenticated users can insert suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Authenticated users can update suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Authenticated users can delete suppliers" ON public.suppliers;

-- Only managers and admins can insert suppliers
CREATE POLICY "Managers can insert suppliers" 
ON public.suppliers FOR INSERT 
TO authenticated
WITH CHECK (public.is_admin_or_manager(auth.uid()));

-- Only managers and admins can update suppliers
CREATE POLICY "Managers can update suppliers" 
ON public.suppliers FOR UPDATE 
TO authenticated
USING (public.is_admin_or_manager(auth.uid()))
WITH CHECK (public.is_admin_or_manager(auth.uid()));

-- Only admins can delete suppliers
CREATE POLICY "Admins can delete suppliers" 
ON public.suppliers FOR DELETE 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- MATERIALS TABLE - Restrict write access
-- ============================================
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.materials;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.materials;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.materials;
DROP POLICY IF EXISTS "Authenticated users can insert materials" ON public.materials;
DROP POLICY IF EXISTS "Authenticated users can update materials" ON public.materials;
DROP POLICY IF EXISTS "Authenticated users can delete materials" ON public.materials;

-- Only managers and admins can insert materials
CREATE POLICY "Managers can insert materials" 
ON public.materials FOR INSERT 
TO authenticated
WITH CHECK (public.is_admin_or_manager(auth.uid()));

-- Only managers and admins can update materials
CREATE POLICY "Managers can update materials" 
ON public.materials FOR UPDATE 
TO authenticated
USING (public.is_admin_or_manager(auth.uid()))
WITH CHECK (public.is_admin_or_manager(auth.uid()));

-- Only admins can delete materials
CREATE POLICY "Admins can delete materials" 
ON public.materials FOR DELETE 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- PURCHASE ORDERS TABLE - Restrict write access
-- ============================================
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.purchase_orders;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.purchase_orders;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.purchase_orders;
DROP POLICY IF EXISTS "Authenticated users can insert purchase_orders" ON public.purchase_orders;
DROP POLICY IF EXISTS "Authenticated users can update purchase_orders" ON public.purchase_orders;
DROP POLICY IF EXISTS "Authenticated users can delete purchase_orders" ON public.purchase_orders;

-- Supervisors and above can insert POs
CREATE POLICY "Supervisors can insert purchase_orders" 
ON public.purchase_orders FOR INSERT 
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'manager') OR 
  public.has_role(auth.uid(), 'supervisor')
);

-- Supervisors and above can update POs
CREATE POLICY "Supervisors can update purchase_orders" 
ON public.purchase_orders FOR UPDATE 
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

-- Only admins can delete POs
CREATE POLICY "Admins can delete purchase_orders" 
ON public.purchase_orders FOR DELETE 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- RECEIVING HOLD LOG - New table needs policies
-- ============================================
-- Supervisors and above can insert hold log entries
CREATE POLICY "Supervisors can insert receiving_hold_log" 
ON public.receiving_hold_log FOR INSERT 
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'manager') OR 
  public.has_role(auth.uid(), 'supervisor')
);

-- Supervisors and above can update hold log entries
CREATE POLICY "Supervisors can update receiving_hold_log" 
ON public.receiving_hold_log FOR UPDATE 
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'manager') OR 
  public.has_role(auth.uid(), 'supervisor')
);

-- Only admins can delete hold log entries
CREATE POLICY "Admins can delete receiving_hold_log" 
ON public.receiving_hold_log FOR DELETE 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));