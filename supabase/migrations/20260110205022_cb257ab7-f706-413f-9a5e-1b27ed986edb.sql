-- Create the update_updated_at_column function if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create enum for template types
CREATE TYPE template_category AS ENUM ('purchase', 'sale', 'inventory', 'production', 'crm', 'financial');
CREATE TYPE template_type AS ENUM ('document', 'email');

-- Create document_templates table
CREATE TABLE public.document_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category template_category NOT NULL,
  template_type template_type NOT NULL DEFAULT 'document',
  description TEXT,
  document_html TEXT,
  document_file_path TEXT,
  document_file_url TEXT,
  email_subject TEXT,
  email_html TEXT,
  email_file_path TEXT,
  email_file_url TEXT,
  send_to_primary_contact BOOLEAN DEFAULT true,
  send_to_all_contacts BOOLEAN DEFAULT false,
  bcc_addresses TEXT[],
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create merge_fields reference table
CREATE TABLE public.template_merge_fields (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category template_category NOT NULL,
  field_key TEXT NOT NULL,
  field_label TEXT NOT NULL,
  description TEXT,
  sample_value TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.document_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_merge_fields ENABLE ROW LEVEL SECURITY;

-- RLS Policies for document_templates
CREATE POLICY "Authenticated users can view templates" ON public.document_templates FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can create templates" ON public.document_templates FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update templates" ON public.document_templates FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete templates" ON public.document_templates FOR DELETE TO authenticated USING (true);

-- RLS Policies for merge_fields
CREATE POLICY "Authenticated users can view merge fields" ON public.template_merge_fields FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage merge fields" ON public.template_merge_fields FOR ALL TO authenticated USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_document_templates_updated_at BEFORE UPDATE ON public.document_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for templates
INSERT INTO storage.buckets (id, name, public) VALUES ('templates', 'templates', false) ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Auth users view template files" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'templates');
CREATE POLICY "Auth users upload template files" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'templates');
CREATE POLICY "Auth users update template files" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'templates');
CREATE POLICY "Auth users delete template files" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'templates');

-- Insert merge fields for all categories
INSERT INTO public.template_merge_fields (category, field_key, field_label, description, sample_value, sort_order) VALUES
('purchase', '{{PO_NUMBER}}', 'PO Number', 'Purchase order number', 'PO-2026-0001', 1),
('purchase', '{{PO_DATE}}', 'PO Date', 'Date the PO was created', '2026-01-10', 2),
('purchase', '{{EXPECTED_DELIVERY}}', 'Expected Delivery Date', 'Expected delivery date', '2026-01-17', 3),
('purchase', '{{SUPPLIER_NAME}}', 'Supplier Name', 'Name of the supplier', 'Acme Ingredients', 4),
('purchase', '{{SUPPLIER_CODE}}', 'Supplier Code', 'Supplier code', 'SUP-001', 5),
('purchase', '{{SUPPLIER_ADDRESS}}', 'Supplier Address', 'Full supplier address', '123 Main St', 6),
('purchase', '{{SUPPLIER_CONTACT}}', 'Supplier Contact', 'Primary contact name', 'John Smith', 7),
('purchase', '{{SUPPLIER_EMAIL}}', 'Supplier Email', 'Primary contact email', 'john@acme.com', 8),
('purchase', '{{SUPPLIER_PHONE}}', 'Supplier Phone', 'Supplier phone number', '555-123-4567', 9),
('purchase', '{{DELIVERY_LOCATION}}', 'Delivery Location', 'Delivery location name', 'Main Warehouse', 10),
('purchase', '{{ITEMS_TABLE}}', 'Line Items Table', 'Table of all line items', '[Items Table]', 11),
('purchase', '{{SUBTOTAL}}', 'Subtotal', 'Order subtotal', '$1,234.56', 12),
('purchase', '{{TAX_AMOUNT}}', 'Tax Amount', 'Tax amount', '$98.77', 13),
('purchase', '{{SHIPPING_AMOUNT}}', 'Shipping Amount', 'Shipping cost', '$50.00', 14),
('purchase', '{{TOTAL_AMOUNT}}', 'Total Amount', 'Total order amount', '$1,383.33', 15),
('purchase', '{{NOTES}}', 'Notes', 'PO notes for supplier', 'Please deliver 8am-5pm', 16),
('purchase', '{{CREATED_BY}}', 'Created By', 'User who created the PO', 'Jane Doe', 17),
('purchase', '{{COMPANY_NAME}}', 'Company Name', 'Your company name', 'Muse Gelato Inc', 18),
('purchase', '{{TODAY_DATE}}', 'Todays Date', 'Current date', '2026-01-10', 19),
('sale', '{{ORDER_NUMBER}}', 'Order Number', 'Sales order number', 'SO-2026-0001', 1),
('sale', '{{ORDER_DATE}}', 'Order Date', 'Date order was placed', '2026-01-10', 2),
('sale', '{{CUSTOMER_NAME}}', 'Customer Name', 'Name of customer', 'ABC Restaurant', 3),
('sale', '{{CUSTOMER_CODE}}', 'Customer Code', 'Customer code', 'CUST-001', 4),
('sale', '{{CUSTOMER_ADDRESS}}', 'Customer Address', 'Full customer address', '789 Oak Ave', 5),
('sale', '{{CUSTOMER_CONTACT}}', 'Customer Contact', 'Primary contact name', 'Mike Johnson', 6),
('sale', '{{CUSTOMER_EMAIL}}', 'Customer Email', 'Customer email', 'mike@abc.com', 7),
('sale', '{{ITEMS_TABLE}}', 'Line Items Table', 'Table of all line items', '[Items Table]', 8),
('sale', '{{SUBTOTAL}}', 'Subtotal', 'Order subtotal', '$2,500.00', 9),
('sale', '{{TOTAL_AMOUNT}}', 'Total Amount', 'Total order amount', '$2,700.00', 10),
('sale', '{{PAYMENT_TERMS}}', 'Payment Terms', 'Payment terms', 'Net 30', 11),
('sale', '{{COMPANY_NAME}}', 'Company Name', 'Your company name', 'Muse Gelato Inc', 12),
('sale', '{{TODAY_DATE}}', 'Todays Date', 'Current date', '2026-01-10', 13),
('inventory', '{{LOT_NUMBER}}', 'Lot Number', 'Internal lot number', 'LOT-2026-0001', 1),
('inventory', '{{MATERIAL_NAME}}', 'Material Name', 'Name of material', 'Vanilla Extract', 2),
('inventory', '{{MATERIAL_CODE}}', 'Material Code', 'Material code', 'MAT-001', 3),
('inventory', '{{QUANTITY}}', 'Quantity', 'Quantity in inventory', '500 kg', 4),
('inventory', '{{LOCATION}}', 'Location', 'Storage location', 'Cold Storage A', 5),
('inventory', '{{EXPIRY_DATE}}', 'Expiry Date', 'Expiration date', '2027-01-10', 6),
('inventory', '{{TODAY_DATE}}', 'Todays Date', 'Current date', '2026-01-10', 7),
('production', '{{PRODUCTION_LOT}}', 'Production Lot', 'Production lot number', 'PROD-2026-0001', 1),
('production', '{{PRODUCT_NAME}}', 'Product Name', 'Name of product', 'Vanilla Gelato', 2),
('production', '{{PRODUCT_SKU}}', 'Product SKU', 'Product SKU', 'GEL-VAN-001', 3),
('production', '{{BATCH_NUMBER}}', 'Batch Number', 'Batch number', '5', 4),
('production', '{{PRODUCTION_DATE}}', 'Production Date', 'Date produced', '2026-01-10', 5),
('production', '{{QUANTITY_PRODUCED}}', 'Quantity Produced', 'Amount produced', '200 cases', 6),
('production', '{{MACHINE}}', 'Machine', 'Production machine', 'Line 1', 7),
('production', '{{TODAY_DATE}}', 'Todays Date', 'Current date', '2026-01-10', 8),
('crm', '{{CONTACT_NAME}}', 'Contact Name', 'Contact full name', 'Sarah Wilson', 1),
('crm', '{{CONTACT_EMAIL}}', 'Contact Email', 'Contact email', 'sarah@example.com', 2),
('crm', '{{COMPANY_NAME}}', 'Company Name', 'Contact company', 'Example Corp', 3),
('crm', '{{TODAY_DATE}}', 'Todays Date', 'Current date', '2026-01-10', 4),
('financial', '{{INVOICE_NUMBER}}', 'Invoice Number', 'Invoice number', 'INV-2026-0001', 1),
('financial', '{{INVOICE_DATE}}', 'Invoice Date', 'Invoice date', '2026-01-10', 2),
('financial', '{{DUE_DATE}}', 'Due Date', 'Payment due date', '2026-02-10', 3),
('financial', '{{AMOUNT_DUE}}', 'Amount Due', 'Amount due', '$1,500.00', 4),
('financial', '{{BALANCE}}', 'Balance', 'Remaining balance', '$1,000.00', 5),
('financial', '{{TODAY_DATE}}', 'Todays Date', 'Current date', '2026-01-10', 6);