-- Performance Optimization: Server-Side Vote Aggregation Function
-- Run this in Supabase SQL Editor

-- Function to get vote breakdown for an event (replaces N+1 query pattern)
CREATE OR REPLACE FUNCTION get_vote_breakdown(event_uuid TEXT)
RETURNS TABLE (
  timeslot_id UUID,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  label TEXT,
  available_count BIGINT,
  maybe_count BIGINT,
  unavailable_count BIGINT,
  total_votes BIGINT,
  vote_percentage NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ts.timeslot_id,
    ts.start_time,
    ts.end_time,
    ts.label,
    COUNT(*) FILTER (WHERE v.availability = 'available') AS available_count,
    COUNT(*) FILTER (WHERE v.availability = 'maybe') AS maybe_count,
    COUNT(*) FILTER (WHERE v.availability = 'unavailable') AS unavailable_count,
    COUNT(*) AS total_votes,
    ROUND(
      (COUNT(*) FILTER (WHERE v.availability = 'available')::NUMERIC /
       NULLIF(COUNT(*), 0)::NUMERIC) * 100,
      1
    ) AS vote_percentage
  FROM time_slots ts
  LEFT JOIN votes v ON ts.timeslot_id = v.timeslot_id
  WHERE ts.event_id = event_uuid
  GROUP BY ts.timeslot_id, ts.start_time, ts.end_time, ts.label
  ORDER BY
    available_count DESC NULLS LAST,
    unavailable_count ASC,
    ts.start_time ASC;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to get recommended time slot (best option)
CREATE OR REPLACE FUNCTION get_recommended_time(event_uuid TEXT)
RETURNS TABLE (
  timeslot_id UUID,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  label TEXT,
  available_count BIGINT,
  vote_percentage NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    breakdown.timeslot_id,
    breakdown.start_time,
    breakdown.end_time,
    breakdown.label,
    breakdown.available_count,
    breakdown.vote_percentage
  FROM get_vote_breakdown(event_uuid) breakdown
  WHERE breakdown.total_votes > 0
  ORDER BY
    breakdown.available_count DESC,
    breakdown.unavailable_count ASC,
    breakdown.start_time ASC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to get participant list with vote counts
CREATE OR REPLACE FUNCTION get_event_participants(event_uuid TEXT)
RETURNS TABLE (
  cookie_id UUID,
  display_name TEXT,
  is_organizer BOOLEAN,
  vote_count BIGINT,
  available_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    uc.cookie_id,
    uc.display_name,
    uc.is_organizer,
    COUNT(v.vote_id) AS vote_count,
    COUNT(*) FILTER (WHERE v.availability = 'available') AS available_count
  FROM user_cookies uc
  LEFT JOIN votes v ON v.cookie_id = uc.cookie_id
  LEFT JOIN time_slots ts ON v.timeslot_id = ts.timeslot_id AND ts.event_id = event_uuid
  WHERE uc.event_id = event_uuid
  GROUP BY uc.cookie_id, uc.display_name, uc.is_organizer
  ORDER BY uc.is_organizer DESC, vote_count DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- Grant execute permissions to anon and authenticated users
GRANT EXECUTE ON FUNCTION get_vote_breakdown(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_recommended_time(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_event_participants(TEXT) TO anon, authenticated;
