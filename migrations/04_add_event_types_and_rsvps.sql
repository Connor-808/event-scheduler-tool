-- Migration 04: Add Event Types and RSVP System
-- Purpose: Support both Fixed Time and Polled Time events
-- Date: October 20, 2025

-- ============================================================================
-- PART 1: Add Event Type Discriminator
-- ============================================================================

-- Add event_type column to distinguish between fixed and polled events
ALTER TABLE events 
ADD COLUMN event_type TEXT NOT NULL DEFAULT 'polled'
CHECK (event_type IN ('fixed', 'polled'));

COMMENT ON COLUMN events.event_type IS 'Type of event: fixed (single time) or polled (multiple options for voting)';

-- Mark all existing events as 'polled' type (they're all voting-based)
UPDATE events SET event_type = 'polled' WHERE event_type IS NULL;

-- ============================================================================
-- PART 2: Add Fixed Time Event Fields
-- ============================================================================

-- For fixed time events, store the single confirmed date/time
-- (Polled events continue using time_slots table)
ALTER TABLE events
ADD COLUMN fixed_datetime TIMESTAMPTZ;

COMMENT ON COLUMN events.fixed_datetime IS 'For fixed-time events: the single confirmed date and time';

-- Add index for querying upcoming fixed events
CREATE INDEX idx_events_fixed_datetime ON events(fixed_datetime) 
WHERE event_type = 'fixed' AND fixed_datetime IS NOT NULL;

-- ============================================================================
-- PART 3: Add Event Locking Metadata
-- ============================================================================

-- Track when and by whom a polled event was locked
ALTER TABLE events
ADD COLUMN locked_at TIMESTAMPTZ,
ADD COLUMN locked_by_cookie_id UUID;

COMMENT ON COLUMN events.locked_at IS 'Timestamp when a polled event was locked/converted to fixed';
COMMENT ON COLUMN events.locked_by_cookie_id IS 'Cookie ID of organizer who locked the event';

CREATE INDEX idx_events_locked ON events(locked_at) WHERE locked_at IS NOT NULL;

-- ============================================================================
-- PART 4: Create RSVPs Table for Fixed Time Events
-- ============================================================================

CREATE TABLE rsvps (
  rsvp_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT NOT NULL REFERENCES events(event_id) ON DELETE CASCADE,
  cookie_id UUID NOT NULL,
  user_name TEXT,
  response TEXT NOT NULL CHECK (response IN ('yes', 'no', 'maybe')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Ensure one RSVP per user per event
  UNIQUE(cookie_id, event_id),
  
  -- Link to user_cookies for referential integrity
  FOREIGN KEY (cookie_id, event_id) REFERENCES user_cookies(cookie_id, event_id) ON DELETE CASCADE
);

COMMENT ON TABLE rsvps IS 'RSVP responses for fixed-time events (yes/no/maybe)';

-- Indexes for performance
CREATE INDEX idx_rsvps_event ON rsvps(event_id);
CREATE INDEX idx_rsvps_event_response ON rsvps(event_id, response);
CREATE INDEX idx_rsvps_cookie ON rsvps(cookie_id);

-- ============================================================================
-- PART 5: Update Timestamp Trigger for RSVPs
-- ============================================================================

-- Create or replace the timestamp update function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Auto-update updated_at timestamp
CREATE TRIGGER rsvps_updated_at
BEFORE UPDATE ON rsvps
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- PART 6: RLS Policies for RSVPs
-- ============================================================================

-- Enable Row Level Security
ALTER TABLE rsvps ENABLE ROW LEVEL SECURITY;

-- Public read access (RSVPs are visible to all event participants)
CREATE POLICY "RSVPs are publicly readable"
ON rsvps FOR SELECT
TO anon, authenticated
USING (true);

-- Public insert access (anyone can RSVP)
CREATE POLICY "Anyone can create RSVPs"
ON rsvps FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Public update access (users can change their RSVP)
CREATE POLICY "Anyone can update RSVPs"
ON rsvps FOR UPDATE
TO anon, authenticated
USING (true);

-- ============================================================================
-- PART 7: Helper Functions
-- ============================================================================

-- Function to get RSVP breakdown for fixed-time events
CREATE OR REPLACE FUNCTION get_rsvp_breakdown(p_event_id TEXT)
RETURNS TABLE (
  response TEXT,
  count BIGINT,
  user_names TEXT[]
) LANGUAGE sql STABLE AS $$
  SELECT 
    r.response,
    COUNT(*) as count,
    ARRAY_AGG(COALESCE(r.user_name, 'Anonymous') ORDER BY r.created_at) as user_names
  FROM rsvps r
  WHERE r.event_id = p_event_id
  GROUP BY r.response
  ORDER BY 
    CASE r.response 
      WHEN 'yes' THEN 1 
      WHEN 'maybe' THEN 2 
      WHEN 'no' THEN 3 
    END;
$$;

COMMENT ON FUNCTION get_rsvp_breakdown IS 'Get RSVP counts and names grouped by response type (yes/maybe/no)';

-- Function to get total RSVP count
CREATE OR REPLACE FUNCTION get_rsvp_count(p_event_id TEXT)
RETURNS BIGINT LANGUAGE sql STABLE AS $$
  SELECT COUNT(*) FROM rsvps WHERE event_id = p_event_id;
$$;

COMMENT ON FUNCTION get_rsvp_count IS 'Get total number of RSVPs for an event';

-- Function to check if user has RSVP'd
CREATE OR REPLACE FUNCTION has_user_rsvpd(p_event_id TEXT, p_cookie_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE AS $$
  SELECT EXISTS(
    SELECT 1 FROM rsvps 
    WHERE event_id = p_event_id AND cookie_id = p_cookie_id
  );
$$;

COMMENT ON FUNCTION has_user_rsvpd IS 'Check if a user has submitted an RSVP for an event';

-- ============================================================================
-- PART 8: Update Existing Functions for Event Types
-- ============================================================================

-- Update get_event_with_summary to include event_type and RSVP data
DROP FUNCTION IF EXISTS get_event_with_summary(TEXT);

CREATE OR REPLACE FUNCTION get_event_with_summary(p_event_id TEXT)
RETURNS TABLE (
  event_id TEXT,
  title TEXT,
  location TEXT,
  notes TEXT,
  hero_image_url TEXT,
  event_type TEXT,
  fixed_datetime TIMESTAMPTZ,
  locked_time_id UUID,
  status TEXT,
  created_at TIMESTAMPTZ,
  organizer_user_id UUID,
  time_slot_count BIGINT,
  participant_count BIGINT,
  vote_count BIGINT,
  rsvp_count BIGINT
) LANGUAGE sql STABLE AS $$
  SELECT 
    e.event_id,
    e.title,
    e.location,
    e.notes,
    e.hero_image_url,
    e.event_type,
    e.fixed_datetime,
    e.locked_time_id,
    e.status,
    e.created_at,
    e.organizer_user_id,
    (SELECT COUNT(*) FROM time_slots WHERE time_slots.event_id = e.event_id) as time_slot_count,
    (SELECT COUNT(DISTINCT cookie_id) FROM user_cookies WHERE user_cookies.event_id = e.event_id) as participant_count,
    (SELECT COUNT(*) FROM votes WHERE votes.event_id = e.event_id) as vote_count,
    (SELECT COUNT(*) FROM rsvps WHERE rsvps.event_id = e.event_id) as rsvp_count
  FROM events e
  WHERE e.event_id = p_event_id;
$$;

COMMENT ON FUNCTION get_event_with_summary IS 'Get event with summary statistics for both fixed and polled events';

-- ============================================================================
-- PART 9: Data Validation
-- ============================================================================

-- Add constraint: fixed events should have fixed_datetime OR time_slots (not both)
-- Note: Implemented at application level for flexibility

-- Add constraint: polled events should have time_slots
-- Note: Implemented at application level for flexibility

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Run these to verify migration success:

-- 1. Check event_type column exists and has correct values
-- SELECT event_type, COUNT(*) FROM events GROUP BY event_type;

-- 2. Check rsvps table exists and has correct structure
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'rsvps';

-- 3. Check indexes were created
-- SELECT indexname FROM pg_indexes WHERE tablename IN ('events', 'rsvps') AND indexname LIKE 'idx_%';

-- 4. Check functions were created
-- SELECT routine_name FROM information_schema.routines WHERE routine_name LIKE '%rsvp%';

-- 5. Test RSVP functions
-- SELECT * FROM get_rsvp_breakdown('test-event-id');
-- SELECT get_rsvp_count('test-event-id');

-- ============================================================================
-- ROLLBACK INSTRUCTIONS (if needed)
-- ============================================================================

-- To rollback this migration:
/*
DROP FUNCTION IF EXISTS get_rsvp_breakdown(TEXT);
DROP FUNCTION IF EXISTS get_rsvp_count(TEXT);
DROP FUNCTION IF EXISTS has_user_rsvpd(TEXT, UUID);
DROP TABLE IF EXISTS rsvps CASCADE;
ALTER TABLE events DROP COLUMN IF EXISTS locked_by_cookie_id;
ALTER TABLE events DROP COLUMN IF EXISTS locked_at;
ALTER TABLE events DROP COLUMN IF EXISTS fixed_datetime;
ALTER TABLE events DROP COLUMN IF EXISTS event_type;
*/

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

