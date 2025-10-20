# Additional Features Setup Guide

## Hero Images

### Overview
Allow organizers to upload optional hero images when creating events.

### Database Setup

Run in Supabase SQL Editor:

```sql
-- Add hero image column to events table
ALTER TABLE events 
ADD COLUMN hero_image_url TEXT,
ADD COLUMN notes TEXT;
```

### Storage Setup

1. Go to **Supabase Dashboard** → **Storage**
2. Click **"New bucket"**
3. Configure the bucket:
   - **Name**: `event-images`
   - **Public bucket**: ✅ **Enable**
   - **File size limit**: `5242880` (5MB)
   - **Allowed MIME types**: 
     - `image/jpeg`
     - `image/jpg`
     - `image/png`
     - `image/gif`
     - `image/webp`
     - `image/heic` (iPhone)
     - `image/heif` (iPhone)

### Storage Policies

In **Storage** → **Policies** for the `event-images` bucket:

```sql
-- Public read access
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'event-images');

-- Service role upload (handled via API)
-- No additional policy needed - uploads use service role key
```

### Features

✅ **Optional** - Images are completely optional  
✅ **Validation** - File type and size checked client and server-side  
✅ **Preview** - Immediate preview before upload  
✅ **Removal** - Users can remove selected image before submitting  
✅ **Error Handling** - Graceful failure (event still creates without image)  
✅ **Modern UI** - Drag & drop upload area  
✅ **iPhone Support** - Accepts HEIC/HEIF formats

### Technical Flow

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

### iPhone/iOS Support

HEIC/HEIF formats are accepted and stored, but browser preview support varies:
- **Safari (iOS/macOS)**: Full HEIC preview support ✅
- **Chrome/Firefox**: Limited HEIC preview (may show blank) ⚠️

For best compatibility, users can:
1. Convert HEIC to JPG on iPhone: Settings → Camera → Formats → Most Compatible
2. Use a third-party converter
3. Upload anyway - will work on iOS/Safari devices

### Testing

1. Go to `/create`
2. Select time slots
3. Click "Next: Event Details"
4. Upload an image (try JPG, PNG, GIF)
5. Verify preview appears
6. Try removing and re-uploading
7. Create the event
8. Verify image URL saved in database

### Troubleshooting

**Image upload fails:**
- Check Storage bucket exists and is named `event-images`
- Verify bucket is set to public
- Check file size is under 5MB
- Verify MIME types are configured

**Images not displaying:**
- Verify storage bucket is public
- Check public URL is generated correctly
- Ensure storage policies allow public read

---

## Mapbox Places API

### Overview
Location search powered by Mapbox for finding real business and venue names.

### Setup

1. **Sign up for Mapbox** (Free tier: 100,000 requests/month)
   - Go to: https://account.mapbox.com/auth/signup/

2. **Get Your Access Token**
   - After signup, go to: https://account.mapbox.com/access-tokens/
   - Copy your **Default public token** (starts with `pk.`)

3. **Add Token to Environment**
   - Open `.env.local`
   - Add:
   ```env
   NEXT_PUBLIC_MAPBOX_TOKEN=pk.your-token-here
   ```

4. **Restart Dev Server**
   ```bash
   npm run dev
   ```

### Features

✅ **100,000 free requests per month**  
✅ **Real business/venue search** (clubs, restaurants, bars, etc.)  
✅ **POI (Point of Interest) data** - much better than OpenStreetMap  
✅ **USA-focused results** with proximity support

### Example Searches

- "Nebula" → Finds Nebula nightclub in NYC
- "Starbucks" → Finds nearby Starbucks locations
- "Central Park" → Finds the actual park
- Any business name or address in the USA

### Integration

The location picker component in `components/ui/location-picker.tsx` automatically uses the Mapbox token for search.

### Pricing

- First 100,000 requests: **FREE**
- After 100,000: **$0.75 per 1,000 requests**

For comparison, you'd need ~130 event creations per day to hit the free limit!

### Troubleshooting

**Search not working:**
- Verify token is in `.env.local`
- Check token starts with `pk.`
- Restart dev server after adding token
- Check browser console for errors

**No results found:**
- Try broader search terms
- Ensure you have internet connection
- Check Mapbox dashboard for API usage/errors

---

## Dark Mode

### Overview
Built-in dark mode toggle with system preference detection.

### Features

- ✅ Automatic system preference detection
- ✅ Manual toggle in header
- ✅ Persists user preference in localStorage
- ✅ Smooth transitions between modes
- ✅ All components support dark mode

### Implementation

The `ThemeToggle` component (`components/ThemeToggle.tsx`) is already integrated in the root layout.

### Colors

**Light Mode:**
- Background: `#ffffff`
- Foreground: `#171717`

**Dark Mode:**
- Background: `#0a0a0a`
- Foreground: `#ededed`

See `STYLEGUIDE.md` for complete color palette.

### Testing

1. Click theme toggle in header
2. Verify all pages switch correctly
3. Refresh page - preference should persist
4. Check system preference detection

---

## Real-time Updates

### Overview
Live vote updates on organizer dashboard using Supabase real-time subscriptions.

### Features

- ✅ Automatic updates when participants vote
- ✅ No page refresh needed
- ✅ Debounced to prevent thrashing (1 second)
- ✅ Shows live participant count
- ✅ Updates vote breakdown in real-time

### Implementation

Already implemented in `app/event/[id]/dashboard/page.tsx`.

### How It Works

```typescript
// Subscribe to vote changes
const channel = supabase
  .channel(`dashboard-votes-${eventId}`)
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'votes',
    filter: `timeslot_id=in.(${timeslotIds})`
  }, handleVoteChange)
  .subscribe();
```

### Troubleshooting

**Updates not working:**
1. Check Supabase real-time is enabled
2. Verify `votes` table is in replication:
   ```sql
   SELECT * FROM pg_publication_tables
   WHERE pubname = 'supabase_realtime';
   ```
3. Add table if missing:
   ```sql
   ALTER PUBLICATION supabase_realtime ADD TABLE votes;
   ```

---

## Event Data Retention

### Overview
Automatic cleanup of old events to manage database size.

### Configuration

Events have a 90-day TTL set on creation:

```typescript
// In API route when creating event
const ttl = new Date();
ttl.setDate(ttl.getDate() + 90); // 90 days from now
```

### Cleanup Function

Create in Supabase:

```sql
-- Function to delete expired events
CREATE OR REPLACE FUNCTION cleanup_expired_events()
RETURNS void AS $$
BEGIN
  DELETE FROM events
  WHERE ttl IS NOT NULL 
  AND ttl < NOW();
END;
$$ LANGUAGE plpgsql;

-- Schedule to run daily
SELECT cron.schedule(
  'cleanup-expired-events',
  '0 2 * * *', -- 2 AM daily
  $$SELECT cleanup_expired_events()$$
);
```

### Manual Cleanup

```sql
-- View events that will be deleted
SELECT event_id, title, ttl 
FROM events 
WHERE ttl < NOW();

-- Manually delete expired events
DELETE FROM events 
WHERE ttl IS NOT NULL 
AND ttl < NOW();
```

---

## Analytics & Monitoring

### Recommended Setup

1. **Vercel Analytics** (if using Vercel)
   - Automatic page view tracking
   - Core Web Vitals monitoring
   - Zero configuration

2. **Supabase Logs**
   - Database query performance
   - API route errors
   - Real-time connection status

3. **Custom Event Tracking**
   ```typescript
   // Track event creation
   analytics.track('event_created', {
     event_id: eventId,
     time_slots: timeSlots.length,
     has_location: !!location,
   });
   
   // Track vote submission
   analytics.track('vote_submitted', {
     event_id: eventId,
     availability: votes.length,
   });
   ```

### Key Metrics to Track

- Event creation rate
- Completion rate (events with locked times)
- Average votes per event
- Time to first vote
- Share link clicks

---

## Future Features (Not Yet Implemented)

### Potential Additions

1. **Email Notifications**
   - Alternative to SMS
   - Lower cost
   - More detailed content

2. **Calendar Export**
   - .ics file generation
   - Add to Google Calendar
   - Apple Calendar support

3. **Multiple Date Options**
   - Poll for best date AND time
   - Show calendar view
   - Mark unavailable dates

4. **Recurring Events**
   - Weekly meetups
   - Monthly gatherings
   - Template system

5. **Event Templates**
   - Save favorite time slots
   - Reuse common settings
   - Quick event creation

6. **Collaborative Organizers**
   - Multiple event owners
   - Permission levels
   - Shared dashboard access

7. **Advanced Analytics**
   - Response patterns
   - Optimal time suggestions
   - Participant engagement metrics

---

## Resources

- [Supabase Storage Documentation](https://supabase.com/docs/guides/storage)
- [Mapbox Geocoding API](https://docs.mapbox.com/api/search/geocoding/)
- [Supabase Realtime Documentation](https://supabase.com/docs/guides/realtime)
- [Tailwind Dark Mode](https://tailwindcss.com/docs/dark-mode)


