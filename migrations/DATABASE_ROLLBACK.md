# Database Rollback Instructions

## Current Situation

Your codebase has been reverted to **October 8, 2025** (commit `eca00d8`), but your Supabase database has the newer schema with migrations that were added later.

The files in this `migrations/` folder are the database changes that were added **after** October 8th. Since you've reverted the code, you need to decide how to handle the database.

---

## Option 1: Rollback Database to Match Code (RECOMMENDED)

If you want your database schema to match the October 8th code, you need to **undo** these migrations.

### Step 1: Open Supabase SQL Editor
Go to your Supabase project → SQL Editor

### Step 2: Run Rollback Commands (in reverse order)

**Rollback Migration 04** (Event Types & RSVPs):
```sql
-- Remove RSVP system
DROP FUNCTION IF EXISTS get_rsvp_breakdown(TEXT);
DROP FUNCTION IF EXISTS get_rsvp_count(TEXT);
DROP FUNCTION IF EXISTS has_user_rsvpd(TEXT, UUID);
DROP FUNCTION IF EXISTS get_event_with_summary(TEXT);
DROP TABLE IF EXISTS rsvps CASCADE;

-- Remove event type fields
ALTER TABLE events DROP COLUMN IF EXISTS locked_by_cookie_id;
ALTER TABLE events DROP COLUMN IF EXISTS locked_at;
ALTER TABLE events DROP COLUMN IF EXISTS fixed_datetime;
ALTER TABLE events DROP COLUMN IF EXISTS event_type;
```

**Rollback Migration 03** (RLS Policies):
```sql
-- Remove security definer functions
DROP FUNCTION IF EXISTS lock_event_time(TEXT, UUID, UUID);

-- Drop all RLS policies
DROP POLICY IF EXISTS "Events are viewable by everyone" ON events;
DROP POLICY IF EXISTS "Authenticated users can create events" ON events;
DROP POLICY IF EXISTS "Cookie-based users can create events" ON events;
DROP POLICY IF EXISTS "Organizers can update their events" ON events;
DROP POLICY IF EXISTS "Time slots are viewable by everyone" ON time_slots;
DROP POLICY IF EXISTS "Time slots can be created with events" ON time_slots;
DROP POLICY IF EXISTS "Time slots can be updated by organizers" ON time_slots;
DROP POLICY IF EXISTS "User cookies are viewable in same event" ON user_cookies;
DROP POLICY IF EXISTS "Users can register their cookies" ON user_cookies;
DROP POLICY IF EXISTS "Users can update their own cookie data" ON user_cookies;
DROP POLICY IF EXISTS "Votes are viewable in same event" ON votes;
DROP POLICY IF EXISTS "Users can submit votes" ON votes;
DROP POLICY IF EXISTS "Users can update their own votes" ON votes;
DROP POLICY IF EXISTS "Users can delete their own votes" ON votes;

-- Optionally disable RLS (if you want it completely off)
-- ALTER TABLE events DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE time_slots DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE user_cookies DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE votes DISABLE ROW LEVEL SECURITY;
```

**Rollback Migration 02** (Aggregation Functions):
```sql
DROP FUNCTION IF EXISTS get_vote_breakdown(TEXT);
DROP FUNCTION IF EXISTS get_recommended_time(TEXT);
DROP FUNCTION IF EXISTS get_event_participants(TEXT);
```

**Rollback Migration 01** (Performance Indexes):
```sql
-- These are just performance optimizations, safe to keep or remove
DROP INDEX IF EXISTS idx_votes_timeslot_cookie;
DROP INDEX IF EXISTS idx_votes_timeslot_availability;
DROP INDEX IF EXISTS idx_events_organizer;
DROP INDEX IF EXISTS idx_time_slots_event;
DROP INDEX IF EXISTS idx_user_cookies_event;
DROP INDEX IF EXISTS idx_user_cookies_organizer;
DROP INDEX IF EXISTS idx_votes_aggregation;
DROP INDEX IF EXISTS idx_events_status;
DROP INDEX IF EXISTS idx_events_locked_time;
DROP INDEX IF EXISTS idx_time_slots_ordering;
DROP INDEX IF EXISTS idx_user_cookies_display;
```

### Step 3: Verify Rollback
```sql
-- Check that rsvps table is gone
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'rsvps';
-- Should return no results

-- Check events table structure
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'events' AND table_schema = 'public'
ORDER BY ordinal_position;
-- Should NOT show: event_type, fixed_datetime, locked_at, locked_by_cookie_id
```

---

## Option 2: Keep New Database Schema

If you want to keep the new database features but just revert the code temporarily:

### What You'll Lose:
- The code won't use the new `event_type`, `fixed_datetime`, or `rsvps` features
- Those database columns will exist but be unused
- No functionality will break, but you won't have the new fixed-time events or RSVP features

### Action Required:
**Nothing!** Just leave the database as-is. The October 8th code only uses:
- `events` table (basic fields)
- `time_slots` table
- `user_cookies` table  
- `votes` table

The extra fields/tables will just be ignored.

---

## Original Database Schema (October 8th)

The original schema only had these tables:

### Tables:
1. **events** - Basic event info (id, title, location, locked_time_id, status, created_at, ttl)
2. **time_slots** - Proposed meeting times
3. **user_cookies** - Anonymous participants  
4. **votes** - Availability votes for time slots

### Key Features That Were Added Later:
- ✨ **Event Types**: `event_type` field ('fixed' vs 'polled')
- ✨ **Fixed Time Events**: `fixed_datetime` field for single-time events
- ✨ **RSVP System**: `rsvps` table for yes/no/maybe responses
- ✨ **Lock Tracking**: `locked_at` and `locked_by_cookie_id` fields
- ⚡ **Performance**: Aggregation functions and indexes
- 🔒 **Security**: RLS policies

---

## What to Do

1. **If you want clean October 8th state**: Follow Option 1 rollback steps
2. **If you're unsure**: Follow Option 2 (keep schema, it won't hurt anything)
3. **If you need help**: Check the full schema in `/SCHEMA.md` (October 8th version)

---

## Need to Restore Recent Code?

If you change your mind and want the newer code back:

```bash
# Switch to the backup branch
git checkout backup-before-revert-20251027-165100

# Create a new branch from it
git checkout -b restored-work

# Push to GitHub
git push origin restored-work
```

This backup contains all the refactored components and API fixes from October 9-27, 2025.

