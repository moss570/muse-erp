-- Add photo columns to materials table for default item photo
ALTER TABLE public.materials
ADD COLUMN IF NOT EXISTS photo_path text,
ADD COLUMN IF NOT EXISTS photo_url text,
ADD COLUMN IF NOT EXISTS photo_added_at timestamptz;