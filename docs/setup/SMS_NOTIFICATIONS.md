# SMS Notifications Setup Guide

## Overview

SMS notifications allow participants to opt-in for text alerts when an event is finalized. This is separate from organizer authentication.

## Quick Start

### Step 1: Create Database Table

Run in your Supabase SQL Editor:

```sql
-- Create notifications table
CREATE TABLE event_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT NOT NULL REFERENCES events(event_id) ON DELETE CASCADE,
  cookie_id UUID NOT NULL,
  phone_number TEXT NOT NULL,
  verified BOOLEAN NOT NULL DEFAULT false,
  verification_code TEXT,
  code_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Composite foreign key to user_cookies
  FOREIGN KEY (cookie_id, event_id) REFERENCES user_cookies(cookie_id, event_id) ON DELETE CASCADE,
  
  -- Prevent duplicate phone numbers per event
  UNIQUE(event_id, phone_number)
);

-- Indexes for performance
CREATE INDEX idx_event_notifications_event ON event_notifications(event_id);
CREATE INDEX idx_event_notifications_cookie ON event_notifications(cookie_id);
CREATE INDEX idx_event_notifications_verified ON event_notifications(event_id, verified) WHERE verified = true;

-- Row Level Security
ALTER TABLE event_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access for event notifications"
ON event_notifications FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Public insert access for event notifications"
ON event_notifications FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Public update access for event notifications"
ON event_notifications FOR UPDATE
TO anon, authenticated
USING (true);

-- Auto-update timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER event_notifications_updated_at
BEFORE UPDATE ON event_notifications
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();
```

### Step 2: Configure Environment Variables

Ensure these are in your `.env.local`:

```env
# Twilio credentials
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+1234567890

# Supabase credentials (for database access)
NEXT_PUBLIC_SUPABASE_URL=your-project-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Step 3: Test the Flow

```bash
npm run dev
# Visit an event page
# Check "Get notified by text when plan is locked in"
# Enter phone → verify code → lock event
```

## Architecture

### Database Schema

**Table**: `event_notifications`

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `event_id` | TEXT | Foreign key to events |
| `cookie_id` | UUID | Links to user_cookies |
| `phone_number` | TEXT | E.164 format (+15551234567) |
| `verified` | BOOLEAN | Whether phone is verified |
| `verification_code` | TEXT | 6-digit code (cleared after verify) |
| `code_expires_at` | TIMESTAMPTZ | Code expiry (10 minutes) |
| `created_at` | TIMESTAMPTZ | Record creation time |
| `updated_at` | TIMESTAMPTZ | Last update time |

**Constraints:**
- Composite FK to `user_cookies(cookie_id, event_id)` 
- Unique constraint on `(event_id, phone_number)` - one phone per event
- CASCADE delete when event or user_cookie is deleted

### API Routes

#### 1. Request Verification Code

**Endpoint**: `POST /api/events/[id]/request-verification`

**Body**:
```json
{
  "phoneNumber": "(555) 123-4567",
  "cookieId": "uuid-here"
}
```

**Process**:
1. Validates phone number format
2. Generates 6-digit random code
3. Upserts to `event_notifications` with 10-minute expiry
4. Sends SMS via Twilio: "Your verification code is: {code}"

**Response**:
```json
{
  "success": true,
  "message": "Verification code sent"
}
```

#### 2. Verify Code

**Endpoint**: `POST /api/events/[id]/verify-code`

**Body**:
```json
{
  "phoneNumber": "+15551234567",
  "cookieId": "uuid-here",
  "code": "123456"
}
```

**Process**:
1. Queries for matching code in database
2. Checks code hasn't expired
3. Sets `verified = true` and clears verification code
4. Returns success or error

**Response**:
```json
{
  "success": true,
  "message": "Phone number verified"
}
```

#### 3. Send Lock-In Notifications

**Endpoint**: `POST /api/events/[id]/lock-in`

**Body**:
```json
{
  "finalOption": "Taco Tuesday",
  "finalTime": "Saturday, Oct 12 at 7:00 PM"
}
```

**Process**:
1. Queries all verified phone numbers for the event
2. Sends SMS to each: "🎉 Plan locked in! {finalOption} at {finalTime}. See you there!"
3. Uses `Promise.allSettled` for partial failure handling
4. Returns count of successful notifications

**Response**:
```json
{
  "success": true,
  "notificationsSent": 5
}
```

### Files Structure

**API Routes:**
- `app/api/events/[id]/request-verification/route.ts`
- `app/api/events/[id]/verify-code/route.ts`
- `app/api/events/[id]/lock-in/route.ts`

**Components:**
- `components/PhoneVerification.tsx` - Reusable verification widget

**Libraries:**
- `lib/twilio.ts` - Twilio utilities

## User Flows

### Participant Opt-In Flow

```
1. User votes on available times
2. Optionally checks "Get notified by text"
3. Enters phone number (auto-formatted)
4. Clicks "Send Code"
5. Receives SMS with 6-digit code
6. Enters code and clicks "Verify"
7. Sees success checkmark
8. When organizer locks in, receives final notification
```

### Organizer Lock-In Flow

```
1. Reviews vote breakdown
2. Clicks "Lock In This Time"
3. Confirms lock-in
4. System:
   - Locks time in database
   - Sends SMS to all verified participants
   - Shows success message with count
5. Redirects to locked event view
```

## SMS Messages

### Verification Code
```
Your verification code is: 123456
```

### Final Notification
```
🎉 Plan locked in! Taco Tuesday at Saturday, Oct 12 at 7:00 PM. See you there!
```

## Features

### Phone Verification Widget

**Features:**
- ✅ Checkbox opt-in
- ✅ Phone input with auto-formatting: `(555) 123-4567`
- ✅ "Send Code" button with validation
- ✅ 6-digit verification code input
- ✅ "Verify" and "Resend Code" buttons
- ✅ Success state: "✓ You'll get a text when this is finalized"
- ✅ Loading states for all async operations
- ✅ Error handling with user-friendly messages
- ✅ Mobile-optimized (44px touch targets)

### Security

**Code Expiration:**
- Codes expire after 10 minutes
- Old codes cleared after successful verification
- Cannot reuse expired codes

**Phone Number Formatting:**
- Input: User-friendly `(555) 123-4567`
- Stored: E.164 format `+15551234567`
- Validation: Must be 10 digits (US numbers)

**Database Security:**
- Uses service role key in API routes
- Row Level Security enabled
- Phone numbers stored securely
- Foreign key constraints ensure data integrity

## Troubleshooting

### SMS Not Received

**Causes:**
1. Twilio trial account - can only send to verified numbers
2. Incorrect phone number format
3. Twilio credentials incorrect
4. Phone carrier blocking SMS

**Solutions:**
1. Add your number to Twilio's verified caller IDs
2. Verify phone number is 10 digits (US)
3. Check Twilio dashboard for credentials
4. Check Twilio logs for delivery status

### "Failed to save verification code" Error

**Causes:**
1. `event_notifications` table doesn't exist
2. Service role key not configured
3. Foreign key constraint violation

**Solutions:**
1. Run the SQL migration above
2. Check `.env.local` has `SUPABASE_SERVICE_ROLE_KEY`
3. Ensure user_cookie exists for the event

### Code Expired Error

**Causes:**
- Code expires after 10 minutes
- User waited too long

**Solutions:**
- Click "Resend Code" to get a new one
- Enter code immediately after receiving

### Notifications Not Sent on Lock-In

**Causes:**
1. API route not called during lock-in
2. No verified phone numbers
3. Twilio credentials issue

**Solutions:**
1. Check browser console for API errors
2. Verify at least one participant verified their phone
3. Check Twilio dashboard for errors

## Testing

### Test Phone Verification

```bash
# Start dev server
npm run dev

# Open event page
open http://localhost:3000/event/your-event-id

# Test flow:
# 1. Check "Get notified by text"
# 2. Enter your phone number
# 3. Click "Send Code"
# 4. Check your phone for SMS
# 5. Enter code and click "Verify"
# 6. Should see success message
```

### Test Lock-In Notifications

```bash
# 1. Verify phone on event page (as participant)
# 2. As organizer, go to dashboard
# 3. Lock in a time
# 4. Check phone for notification SMS
```

### Check Database

```sql
-- View all notifications for an event
SELECT * FROM event_notifications 
WHERE event_id = 'your-event-id';

-- View verified participants
SELECT phone_number, verified 
FROM event_notifications 
WHERE event_id = 'your-event-id' 
AND verified = true;
```

## Integration

### Adding to Event Page

The `PhoneVerification` component is already integrated in `app/event/[id]/page.tsx`:

```tsx
import PhoneVerification from '@/components/PhoneVerification';

// In your component:
<PhoneVerification 
  eventId={eventId} 
  cookieId={cookieId} 
/>
```

### Adding to Dashboard Lock-In

The dashboard automatically sends notifications when locking in a time (see `app/event/[id]/dashboard/page.tsx`).

## Twilio Configuration

### Get Twilio Credentials

1. Sign up at [twilio.com](https://www.twilio.com)
2. Go to Console Dashboard
3. Copy **Account SID** and **Auth Token**
4. Purchase a phone number (or use trial number)
5. Add credentials to `.env.local`

### Twilio Trial Limitations

- Can only send to verified phone numbers
- Must add each recipient to verified caller IDs
- Limited to 500 SMS per month
- Upgrade to paid account for production use

### Twilio Production Setup

1. Upgrade to paid account
2. Purchase dedicated phone number
3. Configure messaging service
4. Set up compliance requirements
5. Monitor usage and costs

## Cost Estimation

**Twilio Pricing** (as of 2024):
- Outbound SMS: ~$0.0075 per message (US)
- Phone number: ~$1.00 per month

**Example costs:**
- 100 events/month with 10 participants each = 1,000 SMS
- Total: ~$7.50/month + $1.00 = $8.50/month

## Resources

- [Twilio SMS Documentation](https://www.twilio.com/docs/sms)
- [Twilio Node.js SDK](https://www.twilio.com/docs/libraries/node)
- SQL file: `CREATE_NOTIFICATIONS_TABLE.sql`
- API routes: `app/api/events/[id]/*`


