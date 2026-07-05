-- Migration: Add video support to x_media_items
-- Run this migration against your Supabase database

-- Step 1: Drop the existing media_type check constraint if it exists (for fresh start)
-- The schema currently has DEFAULT 'image' but no explicit CHECK constraint on values

-- Step 2: Update the unique constraint to include media_type
-- This prevents duplicates between image and video at the same index
-- First drop the old unique constraint
ALTER TABLE public.x_media_items
DROP CONSTRAINT IF EXISTS x_media_items_user_id_post_id_media_index_key;

-- Add new unique constraint that includes media_type
ALTER TABLE public.x_media_items
ADD CONSTRAINT x_media_items_user_id_post_id_media_type_media_index_key
UNIQUE (user_id, post_id, media_type, media_index);

-- Step 3: Add video-related columns (nullable)
ALTER TABLE public.x_media_items
ADD COLUMN IF NOT EXISTS duration_seconds NUMERIC,
ADD COLUMN IF NOT EXISTS thumbnail_url TEXT,
ADD COLUMN IF NOT EXISTS bitrate INTEGER,
ADD COLUMN IF NOT EXISTS content_type TEXT;

-- Step 4: Ensure media_type only accepts 'image' or 'video'
-- Drop existing check if exists and add stricter one
ALTER TABLE public.x_media_items
DROP CONSTRAINT IF EXISTS x_media_items_media_type_check;

ALTER TABLE public.x_media_items
ADD CONSTRAINT x_media_items_media_type_check
CHECK (media_type IN ('image', 'video'));

-- Step 5: Update any NULL media_type to 'image' (should already be default)
UPDATE public.x_media_items
SET media_type = 'image'
WHERE media_type IS NULL;

-- Step 6: Add index for media_type for efficient filtering
CREATE INDEX IF NOT EXISTS idx_x_media_items_media_type ON public.x_media_items(media_type);
