-- Add pallet type configuration columns to product_sizes
ALTER TABLE product_sizes ADD COLUMN IF NOT EXISTS pallet_type TEXT DEFAULT 'US_STANDARD';
ALTER TABLE product_sizes ADD COLUMN IF NOT EXISTS custom_pallet_length_in NUMERIC;
ALTER TABLE product_sizes ADD COLUMN IF NOT EXISTS custom_pallet_width_in NUMERIC;

-- Add comment for documentation
COMMENT ON COLUMN product_sizes.pallet_type IS 'Pallet type: US_STANDARD (48x40), EURO (47.24x31.5), or CUSTOM';
COMMENT ON COLUMN product_sizes.custom_pallet_length_in IS 'Custom pallet length in inches (used when pallet_type is CUSTOM)';
COMMENT ON COLUMN product_sizes.custom_pallet_width_in IS 'Custom pallet width in inches (used when pallet_type is CUSTOM)';