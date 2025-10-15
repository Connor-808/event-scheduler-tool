-- Migration: Add Organizer Authentication Support
-- This allows organizers to have persistent accounts via Supabase Phone Auth
-- while keeping cookie-based anonymous participation for voters

-- Add user_id column to events table to link to authenticated organizers
ALTER TABLE events 
ADD COLUMN organizer_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add index for querying events by organizer
CREATE INDEX idx_events_organizer ON events(organizer_user_id) WHERE organizer_user_id IS NOT NULL;

-- Add optional phone number column to user auth metadata (handled by Supabase Auth)
-- This is already provided by Supabase Phone Auth in auth.users table

-- Note: The existing is_organizer flag in user_cookies table is still used
-- for anonymous cookie-based organizers who haven't authenticated.
-- The new organizer_user_id in events is for authenticated organizers only.

COMMENT ON COLUMN events.organizer_user_id IS 'Links event to authenticated organizer (NULL for anonymous organizers)';

