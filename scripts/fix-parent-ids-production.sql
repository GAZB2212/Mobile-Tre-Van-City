-- Fix parent_id relationships for upgrades with variants
-- This script identifies parent upgrades (those with variant_name = NULL)
-- and sets parent_id for all their variants (those with variant_name != NULL)

-- Update Full Wrap variants
UPDATE upgrades 
SET parent_id = (
  SELECT id FROM upgrades 
  WHERE name = 'Full Wrap' 
  AND category = 'branding' 
  AND variant_name IS NULL
)
WHERE name = 'Full Wrap' 
AND category = 'branding' 
AND variant_name IS NOT NULL;

-- Update Half Wrap variants
UPDATE upgrades 
SET parent_id = (
  SELECT id FROM upgrades 
  WHERE name = 'Half Wrap' 
  AND category = 'branding' 
  AND variant_name IS NULL
)
WHERE name = 'Half Wrap' 
AND category = 'branding' 
AND variant_name IS NOT NULL;

-- Update Graphic Pack variants
UPDATE upgrades 
SET parent_id = (
  SELECT id FROM upgrades 
  WHERE name = 'Graphic Pack' 
  AND category = 'branding' 
  AND variant_name IS NULL
)
WHERE name = 'Graphic Pack' 
AND category = 'branding' 
AND variant_name IS NOT NULL;

-- Update Light Pack Upgraded variants
UPDATE upgrades 
SET parent_id = (
  SELECT id FROM upgrades 
  WHERE name = 'Light Pack Upgraded' 
  AND category = 'lighting' 
  AND variant_name IS NULL
)
WHERE name = 'Light Pack Upgraded' 
AND category = 'lighting' 
AND variant_name IS NOT NULL;

-- Update Van CCTV System variants
UPDATE upgrades 
SET parent_id = (
  SELECT id FROM upgrades 
  WHERE name = 'Van CCTV System' 
  AND category = 'security' 
  AND variant_name IS NULL
)
WHERE name = 'Van CCTV System' 
AND category = 'security' 
AND variant_name IS NOT NULL;

-- Verify the changes
SELECT name, parent_id, variant_name 
FROM upgrades 
WHERE category IN ('branding', 'lighting', 'security')
ORDER BY name, variant_name;
