# Hero Image Feature Setup Guide

## Overview
This guide walks you through setting up the hero image feature for events. Users can now upload optional images when creating events.

## Changes Made

### 1. Code Changes
✅ Added image upload UI to event creation page  
✅ Created `/api/upload-image` endpoint for handling uploads  
✅ Updated `/api/events` to accept `heroImageUrl` and `notes`  
✅ Added image validation (5MB max, image files only)  
✅ Added image preview and removal functionality  

### 2. Database Changes Required

You need to make the following changes in your Supabase project:

#### Step 1: Update the `events` table

Run this SQL in your Supabase SQL Editor:

```sql
-- Add hero_image_url column
ALTER TABLE events 
ADD COLUMN hero_image_url TEXT;

-- Add notes column (if not already exists)
ALTER TABLE events 
ADD COLUMN notes TEXT;
```

#### Step 2: Create Storage Bucket

1. Go to **Supabase Dashboard** → **Storage**
2. Click **"New bucket"**
3. Configure the bucket:
   - **Name**: `event-images`
   - **Public bucket**: ✅ **Enable** (so images can be viewed without authentication)
   - **File size limit**: `5242880` (5MB)
   - **Allowed MIME types**: 
     - `image/jpeg`
     - `image/jpg`
     - `image/png`
     - `image/gif`
     - `image/webp`
     - `image/heic` (iPhone format)
     - `image/heif` (iPhone format)

#### Step 3: Configure Storage Policies

In **Storage** → **Policies** for the `event-images` bucket:

**Policy 1: Public Read Access**
```sql
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'event-images');
```

**Policy 2: Service Role Upload** (already handled via API)
- No need to create an additional policy - uploads are handled server-side using the service role key

## How It Works

### User Flow:
1. User creates event and selects time slots
2. On the "Event Details" page, they can optionally upload an image
3. Image is validated (type and size)
4. Preview is shown immediately
5. On submit:
   - Image is uploaded to Supabase Storage
   - Public URL is generated
   - URL is saved in the `events.hero_image_url` column

### Technical Flow:
1. **Frontend** (`app/create/page.tsx`):
   - User selects image → validates → shows preview
   - On create → uploads to `/api/upload-image`
   - Includes URL in event creation request

2. **Image Upload API** (`/api/upload-image/route.ts`):
   - Receives FormData with image
   - Validates file type and size
   - Generates unique filename
   - Uploads to Supabase Storage
   - Returns public URL

3. **Events API** (`/api/events/route.ts`):
   - Accepts `heroImageUrl` and `notes`
   - Stores in database with event

## Features

✅ **Optional** - Images are completely optional  
✅ **Validation** - File type and size checked client and server-side  
✅ **Preview** - Immediate preview before upload  
✅ **Removal** - Users can remove selected image before submitting  
✅ **Error Handling** - Graceful failure (event still creates without image)  
✅ **Modern UI** - Drag & drop upload area with visual feedback  
✅ **iPhone Support** - Accepts HEIC/HEIF formats from iOS devices

## iPhone/iOS Image Support

The upload supports HEIC/HEIF formats, which are the default formats for photos taken on iPhones (iOS 11+). 

**Note:** While HEIC files are accepted and stored, browser preview support varies:
- **Safari (iOS/macOS)**: Full HEIC preview support ✅
- **Chrome/Firefox**: Limited HEIC preview support (may show blank) ⚠️
- **Solution**: Files are still uploaded successfully and will display properly on compatible devices

For best compatibility across all browsers, users can:
1. Convert HEIC to JPG on their iPhone (Settings → Camera → Formats → Most Compatible)
2. Use a third-party converter
3. Or upload anyway - it will work on iOS/Safari devices  

## Testing

After setup, test the feature:

1. Go to `/create`
2. Select time slots
3. Click "Next: Event Details"
4. Upload an image (try different formats: JPG, PNG, GIF)
5. Verify preview appears
6. Try removing and re-uploading
7. Create the event
8. Verify the image URL is saved in the database

## Database Schema Update

The `events` table now has:

```typescript
interface Event {
  event_id: string;
  title: string;
  location: string | null;
  notes: string | null;              // NEW
  hero_image_url: string | null;     // NEW
  locked_time_id: string | null;
  status: 'active' | 'locked' | 'cancelled';
  created_at: string;
  ttl: string | null;
}
```

## Future Enhancements

Possible future improvements:
- Image cropping/resizing
- Multiple images
- Image compression before upload
- CDN integration
- Display hero image on event pages
- Image optimization for different screen sizes

## Troubleshooting

**Image upload fails:**
- Check Supabase Storage bucket exists and is named `event-images`
- Verify bucket is set to public
- Check file size is under 5MB
- Verify MIME types are configured

**Database error on event creation:**
- Ensure `hero_image_url` and `notes` columns exist in `events` table
- Check Supabase service role key is configured in `.env.local`

**Images not displaying:**
- Verify storage bucket is public
- Check the public URL is being generated correctly
- Ensure storage policies allow public read access

