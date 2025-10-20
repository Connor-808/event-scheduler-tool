# Testing Guide - Phone Auth & Cookie-Based Voting

Quick reference for testing both authentication systems.

## Prerequisites

Before testing, ensure:
1. ✅ Database migration has been run
2. ✅ Supabase Phone Auth is configured
3. ✅ Development server is running (`npm run dev`)

## Test 1: Organizer Signup & Dashboard

**Goal**: Verify phone authentication and dashboard work correctly

### Steps:

1. **Navigate to homepage**
   ```
   http://localhost:3000
   ```

2. **Click "Sign Up" button** in header

3. **Enter phone number**
   - Format: (555) 123-4567
   - Must be a real phone number you can receive SMS on
   - Auto-formats as you type

4. **Check for SMS**
   - Should receive 6-digit code within seconds
   - Check spam if not received immediately
   - Code expires in 10 minutes

5. **Enter verification code**
   - Type 6-digit code from SMS
   - Click "Verify & Sign Up"

6. **Verify redirect to dashboard**
   - Should automatically redirect to `/dashboard`
   - Should show "No events yet" message
   - Should display your phone number in header

✅ **Success Criteria:**
- SMS received
- Code accepted
- Redirected to dashboard
- Phone number displayed

## Test 2: Authenticated Event Creation

**Goal**: Verify events are linked to authenticated organizers

### Steps:

1. **While logged in, click "Create Event"**

2. **Fill out event details**
   - Title: "Test Authenticated Event"
   - Location: "Coffee Shop"
   - Add any optional details

3. **Choose time slots**
   - Select "This Weekend" preset
   - Or add custom slots

4. **Create event**
   - Click "Create Event" button
   - Should redirect to share page

5. **Return to dashboard**
   - Navigate to `/dashboard`
   - Should see newly created event in list

6. **Verify in database** (optional)
   - Open Supabase dashboard
   - Check `events` table
   - Event should have `organizer_user_id` populated

✅ **Success Criteria:**
- Event created successfully
- Event appears in dashboard
- `organizer_user_id` is set in database

## Test 3: Anonymous Voting (No Login)

**Goal**: Verify cookie-based voting still works without login

### Steps:

1. **Open INCOGNITO/PRIVATE browser window**
   - This ensures you're not logged in
   - Fresh cookies

2. **Get event link from Test 2**
   - Should look like: `http://localhost:3000/event/brave-blue-elephant`
   - Copy the event link

3. **Visit event link in incognito window**
   - Paste link and navigate
   - Should see event details
   - No login prompt

4. **Enter display name** (optional)
   - Type your name in the input field
   - This is stored with your cookie

5. **Vote on time slots**
   - Click availability buttons (thumbs up/maybe/unavailable)
   - Select at least 2 different time slots

6. **Submit votes**
   - Click "Submit My Availability"
   - Should see success message

7. **Refresh page**
   - Your votes should persist
   - Should show your previous selections

8. **Check votes as organizer**
   - Go back to logged-in browser
   - Navigate to event dashboard
   - Should see the anonymous vote

✅ **Success Criteria:**
- No login required
- Votes submitted successfully
- Votes persist on refresh
- Votes visible to organizer

## Test 4: Optional Phone Notifications (Voters)

**Goal**: Verify voters can optionally add phone for notifications

### Steps:

1. **In incognito window, on event page**
   - Scroll to phone verification section
   - Should see "Get notified by text when plan is locked in"

2. **Click checkbox to opt-in**
   - UI should expand to show phone input

3. **Enter phone number**
   - Use a different number than organizer
   - Click "Send Code"

4. **Verify SMS received**
   - Should receive verification code
   - Note: This is separate from authentication

5. **Enter code and verify**
   - Type 6-digit code
   - Click "Verify"

6. **Check success message**
   - Should show "✓ You'll get a text when this is finalized"

✅ **Success Criteria:**
- Phone verification works for voters
- Separate from authentication
- Success message displayed
- No login created

## Test 5: Multi-Device Organizer Access

**Goal**: Verify organizer can access dashboard from any device

### Steps:

1. **On second device or browser**
   - Navigate to homepage
   - Click "Login"

2. **Enter same phone number** from Test 1
   - Request new OTP code

3. **Verify and login**
   - Enter code from SMS
   - Should redirect to dashboard

4. **Verify events are there**
   - Should see all events created with this account
   - Same data as first device

✅ **Success Criteria:**
- Can login from different device
- All events accessible
- Data synchronized

## Test 6: Logout & Re-login

**Goal**: Verify logout works and user can login again

### Steps:

1. **In dashboard, click "Sign Out"**
   - Should redirect to homepage
   - No longer authenticated

2. **Try to access dashboard directly**
   - Navigate to `/dashboard`
   - Should redirect to `/login`

3. **Login again**
   - Click "Login" button
   - Enter phone and verify OTP
   - Should access dashboard again

✅ **Success Criteria:**
- Logout works
- Protected routes redirect to login
- Can re-authenticate

## Test 7: Mixed Usage (Edge Case)

**Goal**: Verify both systems can coexist

### Steps:

1. **Logged in as organizer**
   - Create an event

2. **Open event link in incognito**
   - Vote anonymously as participant

3. **As organizer, vote on own event**
   - While logged in, visit event page
   - Add your votes

4. **Check dashboard**
   - Both votes should show
   - Organizer vote AND cookie vote

✅ **Success Criteria:**
- Organizers can also vote
- Votes tracked separately (one as organizer, one as voter)
- No conflicts between systems

## Common Issues & Solutions

### Issue: SMS Not Received

**Solutions:**
1. Check Twilio logs in Supabase dashboard
2. Verify phone number format (+1XXXXXXXXXX)
3. Check Supabase Auth logs
4. Ensure Twilio credentials are correct
5. Try "Resend Code" button

### Issue: Invalid Code Error

**Solutions:**
1. Code expires in 10 minutes - request new one
2. Ensure typing correct 6-digit code
3. Try resending code
4. Check for typos

### Issue: Events Not Showing in Dashboard

**Solutions:**
1. Ensure migration was run
2. Check that you created events while logged in
3. Verify `organizer_user_id` in database
4. Try refreshing page
5. Check browser console for errors

### Issue: Votes Not Persisting

**Solutions:**
1. Check cookies are enabled
2. Clear cookies and try again
3. Ensure not in private/incognito for persistence test
4. Check browser console for errors

### Issue: Can't Access Dashboard

**Solutions:**
1. Ensure you're logged in
2. Clear cache and login again
3. Check Supabase Auth status
4. Verify Auth is enabled in Supabase dashboard

## Performance Checklist

After all tests pass, verify:

- [ ] Dashboard loads quickly
- [ ] Event creation is fast
- [ ] Voting is responsive
- [ ] No console errors
- [ ] SMS delivery is quick (< 30 seconds)
- [ ] No broken links
- [ ] Mobile responsive

## Production Readiness Checklist

Before deploying:

- [ ] All tests passed
- [ ] Database migration applied
- [ ] Supabase Phone Auth configured
- [ ] Rate limiting enabled
- [ ] Environment variables set
- [ ] SMS provider has credits/balance
- [ ] Test with multiple real users
- [ ] Check error handling
- [ ] Monitor Supabase logs

## Quick Test Commands

```bash
# Start dev server
npm run dev

# Open in browser
open http://localhost:3000

# Check for TypeScript errors
npx tsc --noEmit

# Run linter
npm run lint
```

## Success! 🎉

If all tests pass, you have:
✅ Working phone authentication for organizers
✅ Working dashboard with event management
✅ Working anonymous voting with cookies
✅ Optional phone notifications for voters
✅ Both systems working harmoniously

Your app is ready for production! 🚀

