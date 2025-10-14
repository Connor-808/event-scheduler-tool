-- Migration: Add hero image support to events
-- Created: 2025-10-14

-- Add hero_image_url column to events table
ALTER TABLE events 
ADD COLUMN hero_image_url TEXT;

-- Add notes column if not exists (for future use)
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Create storage bucket for event images (run this in Supabase Dashboard -> Storage)
-- Bucket name: 'event-images'
-- Public: true (so images can be viewed without auth)
-- File size limit: 5MB
-- Allowed MIME types: image/png, image/jpeg, image/jpg, image/gif, image/webp, image/heic, image/heif

-- Storage policies (to be applied in Supabase Dashboard)
-- 1. Allow public read access to all images
-- 2. Allow authenticated uploads (service role via API)

/*
To apply this migration:
1. Run this SQL in Supabase SQL Editor
2. Create a storage bucket named 'event-images' in Storage settings
3. Set bucket to public
4. Configure upload size limit (5MB recommended)
5. Set allowed MIME types: image/jpeg, image/png, image/jpg, image/gif, image/webp
*/

