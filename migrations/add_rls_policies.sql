-- Migration: Add Row Level Security Policies
-- Secures public data access while maintaining performance

-- ============================================================================
-- ENABLE RLS ON ALL TABLES
-- ============================================================================

ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_cookies ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- EVENTS TABLE POLICIES
-- ============================================================================

-- Public read access (events are publicly shareable)
DROP POLICY IF EXISTS "Events are publicly readable" ON events;
CREATE POLICY "Events are publicly readable"
ON events FOR SELECT
TO anon, authenticated
USING (true);

-- Only allow inserts via service role (API routes)
-- Note: API routes use service role key which bypasses RLS
-- This policy is for explicit authenticated user creation
DROP POLICY IF EXISTS "Authenticated users can create events" ON events;
CREATE POLICY "Authenticated users can create events"
ON events FOR INSERT
TO authenticated
WITH CHECK (
  -- User can only set themselves as organizer, or leave it NULL for anonymous
  (organizer_user_id = auth.uid()) OR (organizer_user_id IS NULL)
);

-- Allow organizers to update their own events
DROP POLICY IF EXISTS "Organizers can update their events" ON events;
CREATE POLICY "Organizers can update their events"
ON events FOR UPDATE
TO authenticated
USING (organizer_user_id = auth.uid())
WITH CHECK (organizer_user_id = auth.uid());

-- ============================================================================
-- TIME_SLOTS TABLE POLICIES
-- ============================================================================

-- Public read access (time slots are part of public event data)
DROP POLICY IF EXISTS "Time slots are publicly readable" ON time_slots;
CREATE POLICY "Time slots are publicly readable"
ON time_slots FOR SELECT
TO anon, authenticated
USING (true);

-- Allow inserts via service role only (API routes handle validation)
-- No direct insert policy needed - service role bypasses RLS

-- ============================================================================
-- USER_COOKIES TABLE POLICIES
-- ============================================================================

-- Public read access (participant lists are visible to all)
DROP POLICY IF EXISTS "User cookies are publicly readable" ON user_cookies;
CREATE POLICY "User cookies are publicly readable"
ON user_cookies FOR SELECT
TO anon, authenticated
USING (true);

-- Allow anyone to insert their own cookie record (via service role in API)
-- Note: Validation happens in API layer to prevent abuse

-- ============================================================================
-- VOTES TABLE POLICIES
-- ============================================================================

-- Public read access (vote results are visible to all participants)
DROP POLICY IF EXISTS "Votes are publicly readable" ON votes;
CREATE POLICY "Votes are publicly readable"
ON votes FOR SELECT
TO anon, authenticated
USING (true);

-- Allow anyone to insert/update votes (via service role in API)
-- Note: Cookie-based validation happens in application layer
-- RLS would add expensive lookups on every vote operation

-- ============================================================================
-- PERFORMANCE NOTES
-- ============================================================================

/*
Why simple RLS policies?
- Event Scheduler uses cookie-based authentication for voters
- Cookie validation happens in API routes (server-side)
- Complex RLS policies would add JOIN overhead to every query
- All event data is publicly readable by design (shareable links)
- Write operations go through API routes with service role key

Security model:
- Read: Public (by design - events are shareable)
- Write: Controlled via API routes with cookie validation
- Organizer actions: Cookie-based OR auth.uid() check in API layer

This approach maintains both security and performance.
*/

COMMENT ON POLICY "Events are publicly readable" ON events IS 'Events are shareable, so all data is publicly readable';
COMMENT ON POLICY "Votes are publicly readable" ON votes IS 'Vote results are visible to all participants by design';
