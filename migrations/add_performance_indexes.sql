-- Migration: Add Performance Indexes
-- Optimizes the most common query patterns in Event Scheduler

-- ============================================================================
-- VOTES TABLE INDEXES
-- ============================================================================

-- Composite index for vote aggregation (most frequent query)
-- Used by get_vote_breakdown function and dashboard queries
CREATE INDEX IF NOT EXISTS idx_votes_timeslot_availability
ON votes(timeslot_id, availability);

-- Index for cookie-based vote lookups (vote upsert operations)
-- Supports UNIQUE constraint checking and participant vote history
CREATE INDEX IF NOT EXISTS idx_votes_cookie_timeslot
ON votes(cookie_id, timeslot_id);

-- Index for event-wide vote queries
CREATE INDEX IF NOT EXISTS idx_votes_event_lookup
ON votes(event_id);

-- Partial index for "available" votes only (used in recommendations)
CREATE INDEX IF NOT EXISTS idx_votes_available_only
ON votes(timeslot_id)
WHERE availability = 'available';

-- ============================================================================
-- TIME_SLOTS TABLE INDEXES
-- ============================================================================

-- Composite index for event time slot ordering
-- Primary query pattern: fetch all slots for event ordered by time
CREATE INDEX IF NOT EXISTS idx_timeslots_event_time
ON time_slots(event_id, start_time ASC);

-- Index for locked time lookups (when event.locked_time_id is set)
CREATE INDEX IF NOT EXISTS idx_timeslots_id_event
ON time_slots(timeslot_id, event_id);

-- ============================================================================
-- EVENTS TABLE INDEXES
-- ============================================================================

-- Partial index for active events only (reduces index size)
CREATE INDEX IF NOT EXISTS idx_events_active
ON events(event_id, status)
WHERE status = 'active';

-- Partial index for locked events
CREATE INDEX IF NOT EXISTS idx_events_locked
ON events(event_id, locked_time_id)
WHERE locked_time_id IS NOT NULL;

-- Index for TTL cleanup queries
CREATE INDEX IF NOT EXISTS idx_events_ttl
ON events(ttl)
WHERE ttl IS NOT NULL;

-- Index for organizer dashboard (already exists, but ensuring it's there)
CREATE INDEX IF NOT EXISTS idx_events_organizer
ON events(organizer_user_id)
WHERE organizer_user_id IS NOT NULL;

-- ============================================================================
-- USER_COOKIES TABLE INDEXES
-- ============================================================================

-- Index for organizer lookups (used in permission checks)
CREATE INDEX IF NOT EXISTS idx_user_cookies_organizer
ON user_cookies(event_id, cookie_id)
WHERE is_organizer = true;

-- Index for event participant lists
CREATE INDEX IF NOT EXISTS idx_user_cookies_event
ON user_cookies(event_id, last_active DESC);

-- Index for cookie-based lookups across events
CREATE INDEX IF NOT EXISTS idx_user_cookies_cookie
ON user_cookies(cookie_id);

-- ============================================================================
-- ANALYZE TABLES
-- ============================================================================

-- Update table statistics for query planner
ANALYZE events;
ANALYZE time_slots;
ANALYZE user_cookies;
ANALYZE votes;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON INDEX idx_votes_timeslot_availability IS 'Optimizes vote aggregation queries (most frequent operation)';
COMMENT ON INDEX idx_votes_cookie_timeslot IS 'Optimizes vote upsert and user vote history lookups';
COMMENT ON INDEX idx_timeslots_event_time IS 'Optimizes time slot fetching with ordering';
COMMENT ON INDEX idx_events_active IS 'Partial index for active events only';
COMMENT ON INDEX idx_user_cookies_organizer IS 'Fast organizer permission checks';
