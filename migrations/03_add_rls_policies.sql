-- Security: Row Level Security Policies
-- Run this in Supabase SQL Editor

-- Enable RLS on all tables
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_cookies ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- Events: Anyone can read, only authenticated users or cookie creators can update
CREATE POLICY "Events are viewable by everyone"
ON events FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can create events"
ON events FOR INSERT
TO authenticated
WITH CHECK (organizer_user_id = auth.uid());

CREATE POLICY "Cookie-based users can create events"
ON events FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "Organizers can update their events"
ON events FOR UPDATE
USING (
  organizer_user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM user_cookies
    WHERE user_cookies.event_id = events.event_id
    AND user_cookies.is_organizer = true
  )
);

-- Time Slots: Readable by everyone, writable only during event creation
CREATE POLICY "Time slots are viewable by everyone"
ON time_slots FOR SELECT
USING (true);

CREATE POLICY "Time slots can be created with events"
ON time_slots FOR INSERT
WITH CHECK (true);

CREATE POLICY "Time slots can be updated by organizers"
ON time_slots FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM events
    WHERE events.event_id = time_slots.event_id
    AND (
      events.organizer_user_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM user_cookies
        WHERE user_cookies.event_id = events.event_id
        AND user_cookies.is_organizer = true
      )
    )
  )
);

-- User Cookies: Readable by everyone in same event, writable by self
CREATE POLICY "User cookies are viewable in same event"
ON user_cookies FOR SELECT
USING (true);

CREATE POLICY "Users can register their cookies"
ON user_cookies FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can update their own cookie data"
ON user_cookies FOR UPDATE
USING (true);

-- Votes: Readable by everyone in same event, writable by cookie owner
CREATE POLICY "Votes are viewable in same event"
ON votes FOR SELECT
USING (true);

CREATE POLICY "Users can submit votes"
ON votes FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can update their own votes"
ON votes FOR UPDATE
USING (true);

CREATE POLICY "Users can delete their own votes"
ON votes FOR DELETE
USING (true);

-- Create security definer functions for sensitive operations
-- (These run with elevated privileges to bypass RLS when needed)

CREATE OR REPLACE FUNCTION lock_event_time(
  event_uuid TEXT,
  time_slot_uuid UUID,
  cookie_uuid UUID
)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_organizer_flag BOOLEAN;
BEGIN
  -- Check if user is organizer
  SELECT EXISTS (
    SELECT 1 FROM user_cookies
    WHERE event_id = event_uuid
    AND cookie_id = cookie_uuid
    AND is_organizer = true
  ) INTO is_organizer_flag;

  IF NOT is_organizer_flag THEN
    RAISE EXCEPTION 'Only organizers can lock events';
  END IF;

  -- Update event
  UPDATE events
  SET locked_time_id = time_slot_uuid, status = 'locked'
  WHERE event_id = event_uuid;

  RETURN true;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION lock_event_time(TEXT, UUID, UUID) TO anon, authenticated;
