-- Add is_archived and archived_at columns to employee_documents table
ALTER TABLE public.employee_documents 
ADD COLUMN IF NOT EXISTS is_archived boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS archived_at timestamptz;