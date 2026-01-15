-- Rename box dimension columns from cm to inches
ALTER TABLE public.materials
RENAME COLUMN box_length_cm TO box_length_in;

ALTER TABLE public.materials
RENAME COLUMN box_width_cm TO box_width_in;

ALTER TABLE public.materials
RENAME COLUMN box_height_cm TO box_height_in;

-- Add comments for clarity
COMMENT ON COLUMN public.materials.box_length_in IS 'Box length in inches';
COMMENT ON COLUMN public.materials.box_width_in IS 'Box width in inches';
COMMENT ON COLUMN public.materials.box_height_in IS 'Box height in inches';