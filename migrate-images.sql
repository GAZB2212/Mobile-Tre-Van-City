-- Migration script to convert existing upgrade images to public URLs
-- This script will update all existing upgrade images to use direct public Google Cloud Storage URLs

-- Step 1: Check which upgrades have the old /objects/ paths
-- Note: Images are stored in two patterns: /objects/uploads/ and /objects/product-images/
SELECT id, name, images FROM upgrades 
WHERE images::text LIKE '%/objects/%' 
  AND images::text NOT LIKE '%storage.googleapis.com%';

-- Step 2: Create a backup first (RECOMMENDED)
-- CREATE TABLE upgrades_backup_YYYYMMDD AS SELECT * FROM upgrades;

-- Step 3: Find your bucket name
-- Look for the bucket name in your environment variables or object storage settings
-- It will be something like: replit-objstore-XXXX-XXXX-XXXX-XXXX

-- Step 4: Update all upgrade images to use direct GCS public URLs
-- IMPORTANT: Replace 'YOUR-PUBLIC-BUCKET-NAME' with your actual bucket name
UPDATE upgrades
SET images = 
  regexp_replace(
    regexp_replace(
      images::text,
      '"/objects/uploads/',
      '"https://storage.googleapis.com/YOUR-PUBLIC-BUCKET-NAME/upgrade-images/',
      'g'
    ),
    '"/objects/product-images/',
    '"https://storage.googleapis.com/YOUR-PUBLIC-BUCKET-NAME/upgrade-images/',
    'g'
  )::json
WHERE images::text LIKE '%/objects/%' 
  AND images::text NOT LIKE '%storage.googleapis.com%';

-- Step 5: Verify the changes
SELECT id, name, images FROM upgrades WHERE images::text LIKE '%storage.googleapis.com%';

-- Step 6: Manual file migration in Object Storage
-- You'll need to:
-- 1. In Replit Object Storage tool, copy images from 'uploads/' and 'product-images/' folders
-- 2. Paste them into a new 'upgrade-images/' folder in the same bucket
-- 3. Ensure the bucket has public read permissions