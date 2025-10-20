# Authentication Setup Guide

## Overview

Event Scheduler supports two authentication modes:
1. **Organizers**: Optional phone authentication for persistent accounts and dashboard access
2. **Voters**: Anonymous cookie-based participation (no login required)

## Quick Start (5 minutes)

### Step 1: Run Database Migration

Execute in your Supabase SQL Editor:

```sql
ALTER TABLE events 
ADD COLUMN organizer_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX idx_events_organizer ON events(organizer_user_id) WHERE organizer_user_id IS NOT NULL;
```

### Step 2: Enable Phone Auth in Supabase

1. Open Supabase Dashboard → **Authentication** → **Providers**
2. Find **Phone** and click to enable
3. Select **Twilio** as SMS provider
4. Enter your Twilio credentials:
   - Account SID
   - Auth Token  
   - Phone Number (format: +1234567890)
5. Set OTP expiry to **600 seconds** (10 minutes)
6. Click **Save**

### Step 3: Configure Rate Limiting

In Supabase Dashboard → **Authentication** → **Rate Limits**:
- **Phone OTP requests**: 5 per hour per phone number
- **Phone OTP verification attempts**: 10 per hour per phone number

### Step 4: Test the Authentication

```bash
npm run dev
# Visit http://localhost:3000
# Click "Sign Up" → enter phone → verify OTP
# Create event → check dashboard
```

## Architecture

### Dual Authentication System

**Anonymous Voting (Cookie-based)**
- No login required for participants
- UUID stored in browser cookie (`event_scheduler_user`)
- Cookie persists for 365 days
- See `lib/utils.ts` for cookie management

**Organizer Authentication (Optional Phone Auth)**
- Optional Supabase phone authentication
- Events can be created anonymously OR by authenticated users
- Authenticated organizers view all their events in dashboard
- See `lib/auth.ts` for phone OTP functions

### Database Schema Addition

```sql
-- Links events to authenticated organizers (NULL for anonymous)
ALTER TABLE events 
ADD COLUMN organizer_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
```

**Properties:**
- **Type**: UUID (foreign key to Supabase auth.users)
- **Nullable**: Yes (allows anonymous organizers)
- **On Delete**: SET NULL (preserves events if user deleted)
- **Indexed**: Yes (for dashboard queries)

### Files Structure

**New Files:**
- `lib/auth.ts` - Auth utility functions
- `components/PhoneAuth.tsx` - Phone authentication component
- `app/login/page.tsx` - Login page
- `app/signup/page.tsx` - Signup page  
- `app/dashboard/page.tsx` - Organizer dashboard

**Updated Files:**
- `app/create/page.tsx` - Links events to organizers
- `app/api/events/route.ts` - Accepts organizer ID
- `lib/supabase.ts` - Updated Event interface

## User Flows

### Flow 1: Organizer Creates Account & Event

```
1. User visits homepage → clicks "Sign Up"
2. Enters phone number → receives OTP via SMS
3. Enters verification code → account created
4. Redirected to dashboard → clicks "Create Event"
5. Fills out event details → event linked to their account
6. Event appears in their dashboard
7. Can access dashboard from any device by logging in
```

### Flow 2: Anonymous Voter Participates

```
1. User receives event link from organizer
2. Clicks link → no login required
3. Votes on available time slots
4. Optionally provides phone for notifications (separate from auth)
5. Done! No account needed
```

### Flow 3: Organizer Manages Events

```
1. Organizer logs in → sees dashboard
2. Views all their events in one place
3. Clicks event card → goes to event dashboard
4. Can lock in final time, view votes, etc.
5. Creates new events as needed
```

## Features

### For Organizers ✨
- ✅ Phone-based authentication (no passwords)
- ✅ Personal dashboard showing all events
- ✅ Events persist across devices
- ✅ Professional event management
- ✅ Access from anywhere by logging in

### For Voters 🎯
- ✅ No login required
- ✅ Cookie-based participation
- ✅ Simple and fast
- ✅ Optional phone notifications (separate from auth)
- ✅ Privacy-friendly

### Security 🔒
- ✅ OTP expires after 10 minutes
- ✅ Rate limiting on OTP requests
- ✅ Secure phone number storage
- ✅ Supabase Auth best practices
- ✅ Backward compatible with existing data

## Environment Variables

Required in `.env.local`:

```env
# Supabase (already configured)
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Twilio (for auth SMS)
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=your-twilio-phone-number
```

**Note**: Supabase Phone Auth uses your Supabase configuration. The SMS provider is configured through the Supabase dashboard, not directly via environment variables.

## Troubleshooting

### OTP Not Received

1. Check Twilio logs in your Twilio dashboard
2. Verify phone number format is correct (+1XXXXXXXXXX)
3. Check Supabase logs in Dashboard → Logs → Auth
4. Ensure Twilio credentials are correct in Supabase

### Authentication Errors

1. Check browser console for errors
2. Verify Supabase Auth is enabled in dashboard
3. Check that the migration ran successfully
4. Verify environment variables are set correctly
5. Clear browser cache and cookies

### Dashboard Not Showing Events

1. Ensure events were created while authenticated
2. Check that `organizer_user_id` is set on events in database
3. Verify the dashboard query is correct
4. Try refreshing the page

### Can't Login from Different Device

1. Make sure using same phone number
2. Request new OTP code
3. Check that phone number is verified in Supabase Auth
4. Clear browser cache on new device

## Testing

### Test Organizer Flow

```bash
npm run dev
# Visit http://localhost:3000
# Click "Sign Up" → enter your phone → verify OTP
# Create an event → check dashboard
```

### Test Voter Flow

```bash
# Open incognito window
# Visit an event link
# Vote without logging in
```

### Test Multi-Device Access

1. Login on first device
2. Create events
3. Login on second device with same phone
4. Verify all events are accessible

## Security Considerations

### Phone Number Privacy
- Phone numbers stored securely in Supabase Auth
- Never exposed in client-side code
- Protected by Supabase security

### Rate Limiting
- Prevents OTP spam
- Blocks brute force attacks
- Configurable per project

### OTP Expiration
- Codes expire after 10 minutes
- Old codes cleared after verification
- Cannot reuse expired codes

### Row Level Security (RLS)

Consider adding RLS policies for production:

```sql
-- Only show user's own events in dashboard
CREATE POLICY "Users can view their own events"
ON events FOR SELECT
TO authenticated
USING (organizer_user_id = auth.uid());

-- Only authenticated users can update their events
CREATE POLICY "Users can update their own events"
ON events FOR UPDATE
TO authenticated
USING (organizer_user_id = auth.uid());
```

## Rollback

If you need to rollback the authentication feature:

```sql
-- Remove the organizer_user_id column
ALTER TABLE events DROP COLUMN organizer_user_id;

-- Disable Phone Auth in Supabase Dashboard
-- Navigate to Authentication → Providers → Phone and disable
```

## Next Steps (Optional Enhancements)

1. **Email Auth Alternative**
   - Add email/password option
   - Social login (Google, Apple)
   
2. **Profile Management**
   - Let organizers set display name
   - Add profile photo
   - Manage notification preferences

3. **Event Collaboration**
   - Allow multiple organizers per event
   - Transfer ownership
   - Share management access

4. **Analytics**
   - Track event engagement
   - Show participation rates
   - Popular time slots

## Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth/phone-login)
- [Twilio SMS Documentation](https://www.twilio.com/docs/sms)
- Project files: `lib/auth.ts`, `components/PhoneAuth.tsx`


