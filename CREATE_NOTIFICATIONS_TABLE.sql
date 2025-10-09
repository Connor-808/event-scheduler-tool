-- Event Notifications Table for SMS Verification
-- Run this SQL in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS event_notifications (
  -- Composite primary key (same pattern as user_cookies)
  cookie_id UUID NOT NULL,
  event_id TEXT NOT NULL REFERENCES events(event_id) ON DELETE CASCADE,
  
  -- Phone verification
  phone_number TEXT NOT NULL, -- E.164 format: +15551234567
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  verification_code TEXT, -- 6-digit code, cleared after verification
  code_expires_at TIMESTAMPTZ, -- 10-minute expiry for codes
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Composite primary key
  PRIMARY KEY (cookie_id, event_id),
  
  -- Foreign key to user_cookies
  FOREIGN KEY (cookie_id, event_id) REFERENCES user_cookies(cookie_id, event_id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX idx_event_notifications_event ON event_notifications(event_id);
CREATE INDEX idx_event_notifications_cookie ON event_notifications(cookie_id);
CREATE INDEX idx_event_notifications_verified ON event_notifications(event_id, verified) WHERE verified = TRUE;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_event_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_event_notifications_updated_at 
BEFORE UPDATE ON event_notifications
FOR EACH ROW EXECUTE FUNCTION update_event_notifications_updated_at();

-- Enable Row Level Security
ALTER TABLE event_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Anyone can read (for now, can be restricted later)
CREATE POLICY "Event notifications are publicly readable"
ON event_notifications FOR SELECT
TO public
USING (true);

-- Allow inserts and updates via service role (API routes)
-- Note: Your API routes should use service role key for insert/update operations

COMMENT ON TABLE event_notifications IS 'Stores phone verification and notification preferences for event participants';
COMMENT ON COLUMN event_notifications.phone_number IS 'E.164 format phone number (+1XXXXXXXXXX)';
COMMENT ON COLUMN event_notifications.verification_code IS '6-digit code sent via SMS, cleared after successful verification';
COMMENT ON COLUMN event_notifications.code_expires_at IS 'Verification code expires 10 minutes after sending';

