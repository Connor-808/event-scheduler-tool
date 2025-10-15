# Supabase Phone Authentication Setup Guide

This guide will help you enable Supabase Phone Authentication for organizer accounts.

## Overview

The app now supports two types of users:
- **Organizers (Authenticated)**: Use phone authentication to create events and manage them via a dashboard
- **Voters (Anonymous)**: Continue using cookie-based participation without any login required

## Prerequisites

- Supabase project already set up
- Twilio account (or another SMS provider supported by Supabase)

## Step 1: Run Database Migration

Apply the database migration to add organizer authentication support:

```sql
-- Run this in your Supabase SQL Editor
-- Location: migrations/add_organizer_auth.sql

ALTER TABLE events 
ADD COLUMN organizer_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX idx_events_organizer ON events(organizer_user_id) WHERE organizer_user_id IS NOT NULL;

COMMENT ON COLUMN events.organizer_user_id IS 'Links event to authenticated organizer (NULL for anonymous organizers)';
```

## Step 2: Enable Phone Auth in Supabase

### Option A: Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** → **Providers**
3. Find **Phone** in the list and click to configure
4. Enable Phone authentication
5. Choose your SMS provider (Twilio, MessageBird, Vonage, or Textlocal)

### Option B: Using Twilio (Most Common)

If you're already using Twilio for notifications, you can reuse the same credentials:

1. In Supabase Dashboard → **Authentication** → **Providers** → **Phone**
2. Select **Twilio** as your SMS provider
3. Enter your Twilio credentials:
   - **Twilio Account SID**: (from your Twilio dashboard)
   - **Twilio Auth Token**: (from your Twilio dashboard)
   - **Twilio Phone Number**: Your Twilio phone number (format: +1234567890)
4. Configure OTP settings:
   - **OTP expiration**: 600 seconds (10 minutes) - recommended
   - **OTP length**: 6 digits - recommended
5. Save configuration

## Step 3: Configure Rate Limiting (Important for Production)

To prevent abuse, configure rate limiting for phone authentication:

1. In Supabase Dashboard → **Authentication** → **Rate Limits**
2. Recommended settings:
   - **Phone OTP requests**: 5 per hour per phone number
   - **Phone OTP verification attempts**: 10 per hour per phone number

## Step 4: Test Authentication Flow

### Test Signup/Login

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to `http://localhost:3000`
3. Click "Sign Up" in the header
4. Enter your phone number
5. You should receive an SMS with a 6-digit code
6. Enter the code to complete authentication
7. You should be redirected to the dashboard

### Test Event Creation as Authenticated User

1. While logged in, click "Create Event"
2. Fill out event details and create the event
3. The event should now be linked to your user account
4. Navigate to the dashboard to see your events

### Test Anonymous Voting (No Login Required)

1. Open an incognito/private browser window
2. Navigate to an event link (e.g., `http://localhost:3000/event/your-event-id`)
3. Vote on time slots without any login
4. Cookies are used to track your votes

## Step 5: Environment Variables

Make sure you have these environment variables set:

```env
# Supabase (already configured)
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Twilio (for notifications - already configured if using SMS notifications)
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=your-twilio-phone-number
```

**Note**: Supabase Phone Auth uses your Supabase configuration, not your direct Twilio credentials in environment variables. The SMS provider is configured through the Supabase dashboard.

## Features Enabled

### For Organizers (Authenticated Users)

1. **Persistent Accounts**: Phone-based authentication
2. **Organizer Dashboard**: View all events they've created at `/dashboard`
3. **Event Management**: Events are linked to their user account
4. **Multiple Devices**: Can access their events from any device by logging in

### For Voters (Anonymous Users)

1. **No Login Required**: Vote using cookies only
2. **Simple Participation**: Just click the event link and vote
3. **Optional Notifications**: Can optionally verify phone for SMS updates (separate from auth)

## Security Considerations

1. **Phone Number Privacy**: Phone numbers are stored securely in Supabase Auth
2. **Rate Limiting**: Prevents OTP spam and brute force attacks
3. **OTP Expiration**: Codes expire after 10 minutes
4. **RLS Policies**: Ensure proper Row Level Security policies are in place:

```sql
-- Example: Only show user's own events in dashboard
CREATE POLICY "Users can view their own events"
ON events FOR SELECT
TO authenticated
USING (organizer_user_id = auth.uid());
```

## Troubleshooting

### OTP Not Received

1. Check Twilio logs in your Twilio dashboard
2. Verify phone number format is correct (+1XXXXXXXXXX)
3. Check Supabase logs in Dashboard → Logs → Auth

### Authentication Errors

1. Check browser console for errors
2. Verify Supabase Auth is enabled
3. Check that the migration ran successfully
4. Verify environment variables are set correctly

### Dashboard Not Showing Events

1. Ensure events were created while authenticated
2. Check that `organizer_user_id` is set on events
3. Verify the SQL query in dashboard is correct

## Next Steps

1. Add RLS policies for authenticated users
2. Consider adding email as an alternative authentication method
3. Add profile management for organizers
4. Implement event sharing and collaboration features

## Rollback

If you need to rollback the organizer authentication feature:

```sql
-- Remove the organizer_user_id column
ALTER TABLE events DROP COLUMN organizer_user_id;

-- Disable Phone Auth in Supabase Dashboard
-- Navigate to Authentication → Providers → Phone and disable
```

## Support

- **Supabase Auth Docs**: https://supabase.com/docs/guides/auth/phone-login
- **Twilio SMS Docs**: https://www.twilio.com/docs/sms
- **Project Issues**: Check the repository issues for common problems

