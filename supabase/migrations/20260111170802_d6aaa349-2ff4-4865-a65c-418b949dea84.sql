-- Add expiry_date and archival fields to material_documents to match supplier_documents
ALTER TABLE public.material_documents 
ADD COLUMN IF NOT EXISTS expiry_date date,
ADD COLUMN IF NOT EXISTS is_archived boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS archived_at timestamptz,
ADD COLUMN IF NOT EXISTS archived_by uuid REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS archive_reason text;

-- Add archival fields to supplier_documents as well
ALTER TABLE public.supplier_documents 
ADD COLUMN IF NOT EXISTS is_archived boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS archived_at timestamptz,
ADD COLUMN IF NOT EXISTS archived_by uuid REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS archive_reason text;