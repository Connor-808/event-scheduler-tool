-- Migration: Add Vote Aggregation Database Function
-- This optimizes the most frequently called query in the app
-- Impact: Reduces vote breakdown from N+1 queries to single efficient query

-- Create function for efficient server-side vote aggregation
CREATE OR REPLACE FUNCTION get_vote_breakdown(p_event_id TEXT)
RETURNS TABLE (
  timeslot_id UUID,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  label TEXT,
  available_count BIGINT,
  maybe_count BIGINT,
  unavailable_count BIGINT,
  total_votes BIGINT,
  availability_score NUMERIC
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT
    ts.timeslot_id,
    ts.start_time,
    ts.end_time,
    ts.label,
    COUNT(*) FILTER (WHERE v.availability = 'available') as available_count,
    COUNT(*) FILTER (WHERE v.availability = 'maybe') as maybe_count,
    COUNT(*) FILTER (WHERE v.availability = 'unavailable') as unavailable_count,
    COUNT(v.vote_id) as total_votes,
    -- Availability score for sorting: available votes minus unavailable votes
    COUNT(*) FILTER (WHERE v.availability = 'available') -
    COUNT(*) FILTER (WHERE v.availability = 'unavailable') as availability_score
  FROM time_slots ts
  LEFT JOIN votes v ON ts.timeslot_id = v.timeslot_id
  WHERE ts.event_id = p_event_id
  GROUP BY ts.timeslot_id, ts.start_time, ts.end_time, ts.label
  ORDER BY availability_score DESC, total_votes DESC, ts.start_time ASC;
$$;

COMMENT ON FUNCTION get_vote_breakdown IS 'Efficiently aggregates vote counts per timeslot with single query (replaces N+1 pattern)';

-- Create function to get event with all related data in one query
CREATE OR REPLACE FUNCTION get_event_with_summary(p_event_id TEXT)
RETURNS JSON
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'event', row_to_json(e),
    'time_slots', (
      SELECT json_agg(
        json_build_object(
          'timeslot_id', ts.timeslot_id,
          'start_time', ts.start_time,
          'end_time', ts.end_time,
          'label', ts.label,
          'created_at', ts.created_at,
          'vote_counts', (
            SELECT json_build_object(
              'available', COUNT(*) FILTER (WHERE v.availability = 'available'),
              'maybe', COUNT(*) FILTER (WHERE v.availability = 'maybe'),
              'unavailable', COUNT(*) FILTER (WHERE v.availability = 'unavailable'),
              'total', COUNT(v.vote_id)
            )
            FROM votes v
            WHERE v.timeslot_id = ts.timeslot_id
          )
        )
        ORDER BY ts.start_time ASC
      )
      FROM time_slots ts
      WHERE ts.event_id = e.event_id
    ),
    'participants', (
      SELECT json_agg(
        json_build_object(
          'cookie_id', uc.cookie_id,
          'display_name', uc.display_name,
          'is_organizer', uc.is_organizer,
          'created_at', uc.created_at,
          'last_active', uc.last_active
        )
        ORDER BY uc.is_organizer DESC, uc.created_at ASC
      )
      FROM user_cookies uc
      WHERE uc.event_id = e.event_id
    ),
    'locked_time', (
      SELECT row_to_json(lt)
      FROM time_slots lt
      WHERE lt.timeslot_id = e.locked_time_id
      LIMIT 1
    ),
    'participant_count', (
      SELECT COUNT(DISTINCT cookie_id)
      FROM user_cookies
      WHERE event_id = e.event_id
    ),
    'vote_count', (
      SELECT COUNT(DISTINCT v.vote_id)
      FROM votes v
      INNER JOIN time_slots ts ON v.timeslot_id = ts.timeslot_id
      WHERE ts.event_id = e.event_id
    )
  ) INTO result
  FROM events e
  WHERE e.event_id = p_event_id;

  RETURN result;
END;
$$;

COMMENT ON FUNCTION get_event_with_summary IS 'Returns complete event data with aggregated stats in single query';
