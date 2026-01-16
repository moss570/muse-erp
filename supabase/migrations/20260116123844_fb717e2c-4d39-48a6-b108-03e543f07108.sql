-- Fix the sku_prefix unique constraint to allow multiple NULL values
-- Drop the existing constraint
ALTER TABLE public.product_categories
DROP CONSTRAINT IF EXISTS product_categories_sku_prefix_unique;

-- Create a partial unique index that only applies to non-empty values
CREATE UNIQUE INDEX product_categories_sku_prefix_unique 
ON public.product_categories (sku_prefix) 
WHERE sku_prefix IS NOT NULL AND sku_prefix != '';

-- Add default_category_ids array to quality_test_templates for category defaults
ALTER TABLE public.quality_test_templates
ADD COLUMN IF NOT EXISTS default_for_category_ids UUID[] DEFAULT '{}';