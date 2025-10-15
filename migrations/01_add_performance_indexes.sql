-- Performance Optimization: Add Indexes for Common Queries
-- Run this in Supabase SQL Editor

-- Index for vote queries (most critical - used in every dashboard load)
CREATE INDEX IF NOT EXISTS idx_votes_timeslot_cookie
ON votes(timeslot_id, cookie_id);

CREATE INDEX IF NOT EXISTS idx_votes_timeslot_availability
ON votes(timeslot_id, availability);

-- Index for event lookups by organizer
CREATE INDEX IF NOT EXISTS idx_events_organizer
ON events(organizer_user_id)
WHERE organizer_user_id IS NOT NULL;

-- Index for time_slots by event
CREATE INDEX IF NOT EXISTS idx_time_slots_event
ON time_slots(event_id);

-- Index for user_cookies by event
CREATE INDEX IF NOT EXISTS idx_user_cookies_event
ON user_cookies(event_id);

-- Index for user_cookies organizer lookup
CREATE INDEX IF NOT EXISTS idx_user_cookies_organizer
ON user_cookies(event_id, cookie_id)
WHERE is_organizer = true;

-- Composite index for vote aggregation queries
CREATE INDEX IF NOT EXISTS idx_votes_aggregation
ON votes(timeslot_id, availability, cookie_id);

-- Index for event status queries
CREATE INDEX IF NOT EXISTS idx_events_status
ON events(status);

-- Index for locked time lookups
CREATE INDEX IF NOT EXISTS idx_events_locked_time
ON events(locked_time_id)
WHERE locked_time_id IS NOT NULL;

-- Index for time slot ordering
CREATE INDEX IF NOT EXISTS idx_time_slots_ordering
ON time_slots(event_id, start_time);

-- Index for participant display names
CREATE INDEX IF NOT EXISTS idx_user_cookies_display
ON user_cookies(event_id, display_name);

-- Analyze tables to update statistics
ANALYZE votes;
ANALYZE events;
ANALYZE time_slots;
ANALYZE user_cookies;
