# Event Scheduler - User Journey Flows

## Document Overview

This document maps all user journeys through the Event Scheduler application, detailing every step, decision point, system action, and user interface element. Each flow includes success criteria, error handling, and technical implementation notes.

---

## Flow Index

1. **Primary Flow: Event Creation & Sharing** (Organizer)
2. **Secondary Flow: Participant Voting**
3. **Tertiary Flow: Organizer Dashboard & Locking Time**
4. **Supporting Flow: Vote Modification**
5. **Supporting Flow: Event Cancellation**
6. **Edge Cases & Error Handling**

---

## 1. PRIMARY FLOW: Event Creation & Sharing (Organizer)

**User Type**: Event Organizer (First-time or Returning)  
**Entry Point**: Landing page  
**Goal**: Create schedulable event and share with participants  
**Estimated Time**: 45-60 seconds

### Step-by-Step Journey

#### Step 1.1: Landing Page
**URL**: `https://[domain].com/`

**User Sees**:
- Clean, minimal landing page
- Hero section with value proposition
- Primary CTA button: "Create an Event"
- Optional: Brief feature highlights (3-4 bullet points)
- Footer with links (Privacy, Terms)

**User Actions**:
- Clicks "Create an Event" button

**System Actions**:
- Check for existing cookie_id in browser
- If no cookie exists, generate new UUID and store in cookie
- Navigate to `/create` route

**Technical Notes**:
```javascript
// On page load
const cookieId = getCookie('event_scheduler_user');
if (!cookieId) {
  const newCookieId = generateUUID();
  setCookie('event_scheduler_user', newCookieId, { maxAge: 365 * 24 * 60 * 60 });
}
```

---

#### Step 1.2: Time Selection Screen
**URL**: `https://[domain].com/create`

**User Sees**:
- Page header: "When should we meet?"
- Two main options presented as tabs or sections:
  1. **Quick Presets** (Recommended)
  2. **Custom Times**

**Option A: Quick Presets**

**User Sees**:
- Three preset buttons with icons:
  - "This Weekend" (Shows: Sat 10am, Sat 2pm, Sun 11am)
  - "Next Weekend" (Shows: Next Sat 10am, Next Sat 2pm, Next Sun 11am)
  - "Weekday Evenings" (Shows: Mon 7pm, Wed 7pm, Thu 7pm)
- Each preset shows the actual dates/times it will generate
- Selected preset is highlighted

**User Actions**:
- Clicks one preset option
- System auto-generates 3 time slots
- Preview of generated times appears below
- User can click "Use These Times" to confirm

**System Actions**:
```javascript
// Example: "This Weekend" clicked
const now = new Date();
const thisSaturday = getNextDayOfWeek(now, 6); // 6 = Saturday
const thisSunday = getNextDayOfWeek(now, 0);   // 0 = Sunday

const timeSlots = [
  { start: setSaturday.setHours(10, 0), label: "Saturday Morning" },
  { start: setSaturday.setHours(14, 0), label: "Saturday Afternoon" },
  { start: thisSunday.setHours(11, 0), label: "Sunday Morning" }
];
```

**Option B: Custom Times**

**User Sees**:
- Empty time slot input form
- "Add Time Slot" button
- Minimum 2 slots required, maximum 10 allowed
- Each slot has:
  - Date picker (calendar interface)
  - Time picker (dropdown or time input)
  - Optional: End time toggle
  - Optional: Custom label input
  - Remove button (if more than 2 slots)

**User Actions**:
- Clicks "Add Time Slot"
- Selects date from calendar picker
- Selects time from dropdown
- Optionally adds custom label (e.g., "Brunch time")
- Repeats for additional slots
- Can remove any slot except when only 2 remain

**System Actions**:
- Validates minimum 2 slots before allowing progression
- Sorts time slots chronologically
- Prevents duplicate exact times
- Shows count: "3 of 10 time slots added"

**Validation Rules**:
- All times must be in the future
- No duplicate timestamps
- At least 2 time slots required
- Maximum 10 time slots allowed

**User Actions to Proceed**:
- Clicks "Next: Event Details" button (only enabled when valid)

---

#### Step 1.3: Event Details Screen
**URL**: `https://[domain].com/create/details` (or same page, next section)

**User Sees**:
- Form with fields:
  - Event Title (required)
    - Placeholder: "What are we doing?"
    - Character limit: 100
    - Example: "Weekend Brunch Plans"
  - Location (optional)
    - Placeholder: "Where should we meet?"
    - Character limit: 200
    - Example: "Downtown area"
    - Future: Autocomplete with Google Places
  - Additional Notes (optional)
    - Placeholder: "Any other details?"
    - Character limit: 500
    - Multiline textarea
- "Back" button to edit time slots
- "Create Event" primary CTA button

**User Actions**:
- Fills in event title (required)
- Optionally fills in location
- Optionally adds notes
- Clicks "Create Event"

**System Actions**:
1. Validate required fields
2. Generate unique event_id using unique-names-generator:
   ```javascript
   import { uniqueNamesGenerator, adjectives, colors, animals } from 'unique-names-generator';
   
   const eventId = uniqueNamesGenerator({
     dictionaries: [adjectives, colors, animals],
     separator: '-',
     length: 3,
     style: 'lowerCase'
   });
   // Result: "brave-blue-elephant"
   ```
3. Create database records:
   ```sql
   -- Insert event
   INSERT INTO events (event_id, title, location, status)
   VALUES ('brave-blue-elephant', 'Weekend Brunch Plans', 'Downtown', 'active');
   
   -- Insert time slots
   INSERT INTO time_slots (event_id, start_time, label)
   VALUES 
     ('brave-blue-elephant', '2025-10-12 10:00:00', 'Saturday Morning'),
     ('brave-blue-elephant', '2025-10-12 14:00:00', 'Saturday Afternoon'),
     ('brave-blue-elephant', '2025-10-13 11:00:00', 'Sunday Morning');
   
   -- Create organizer cookie record
   INSERT INTO user_cookies (cookie_id, event_id, is_organizer)
   VALUES ('[user-cookie-id]', 'brave-blue-elephant', true);
   ```
4. Set TTL for event (90 days from creation)
5. Navigate to sharing screen

**Loading State**:
- Show spinner/skeleton
- Message: "Creating your event..."
- Duration: 1-2 seconds typically

---

#### Step 1.4: Share Screen
**URL**: `https://[domain].com/event/brave-blue-elephant/share`

**User Sees**:
- Success animation (checkmark, confetti, etc.)
- Event title displayed prominently
- Generated shareable link in copyable text box:
  - `https://[domain].com/event/brave-blue-elephant`
- Two primary actions:
  1. **Share Button** (uses native mobile share if available)
     - Pre-populated message:
       - "Let's figure out when we can meet! Vote on your availability: [link]"
     - On mobile: Opens native share sheet
     - On desktop: Shows copy confirmation
  2. **Copy Link Button**
     - Copies link to clipboard
     - Shows temporary confirmation: "Link copied!"
- Secondary action:
  - "View Organizer Dashboard" button
- Preview of what participants will see (optional)

**User Actions**:
- Option 1: Clicks "Share" → Opens share sheet → Selects app → Sends
- Option 2: Clicks "Copy Link" → Pastes in group chat manually
- Option 3: Clicks "View Dashboard" → Navigates to organizer view

**System Actions**:
```javascript
// Native share API
if (navigator.share) {
  navigator.share({
    title: eventData.title,
    text: "Let's figure out when we can meet! Vote on your availability:",
    url: `https://[domain].com/event/${eventId}`
  });
} else {
  // Fallback to copy
  navigator.clipboard.writeText(fullUrl);
  showToast("Link copied!");
}
```

**Technical Notes**:
- Share screen is accessible anytime via `/event/[id]/share`
- Organizer can return here to reshare link
- Link never expires (unless event TTL reached)

---

#### Step 1.5: Organizer Dashboard (Initial State)
**URL**: `https://[domain].com/event/brave-blue-elephant/dashboard`

**Access Control**:
- Verify cookie_id matches organizer in user_cookies table
- If not organizer, redirect to participant view
- If organizer, proceed to dashboard

**User Sees - Initial State (No Votes Yet)**:
- Event details header:
  - Event title
  - Location (if provided)
  - Status badge: "Waiting for responses"
- Response section:
  - "0 of 0 people have responded"
  - Empty state illustration
  - Call-to-action: "Share your event link to get responses"
  - "Copy Link" and "Share" buttons (same as share screen)
- Time slots section:
  - List of all proposed time slots
  - Each shows: Date, Time, Label
  - Vote count: "0 votes" for each
  - Empty state: "No votes yet"
- Actions section:
  - "Send Reminder" button (disabled until responses)
  - "Cancel Event" button (destructive action)

**User Actions**:
- Monitors dashboard waiting for responses
- Can reshare link
- Can cancel event if needed
- Browser stays on this page or user bookmarks it

**System Actions**:
- Poll for new votes every 5 seconds (or use Supabase real-time)
- Update UI automatically when votes come in
- Show notification badge when new vote received

**Real-time Updates**:
```javascript
// Supabase real-time subscription
const votesSubscription = supabase
  .channel('event-votes')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'votes',
    filter: `timeslot_id=in.(${timeslotIds.join(',')})`
  }, handleNewVote)
  .subscribe();
```

---

### Success Criteria for Primary Flow
- ✅ Event created in < 60 seconds
- ✅ Shareable link generated successfully
- ✅ Link opens correctly on any device
- ✅ Organizer can access dashboard
- ✅ Zero authentication friction
- ✅ Mobile-optimized throughout

---

## 2. SECONDARY FLOW: Participant Voting

**User Type**: Event Participant (Invited friend)  
**Entry Point**: Shared event link (via text, social media, etc.)  
**Goal**: Vote on availability for proposed times  
**Estimated Time**: 20-30 seconds

### Step-by-Step Journey

#### Step 2.1: Link Receipt & Click
**Entry Point**: Participant receives link via messaging app

**User Sees** (in messaging app):
- Message from organizer: "Let's figure out when we can meet! Vote on your availability: https://[domain].com/event/brave-blue-elephant"
- Link preview (if supported):
  - Event title
  - Brief description
  - App logo/icon

**User Actions**:
- Clicks on link
- Browser/app opens

**System Actions**:
- Link opens in default browser or in-app browser
- Load event page

---

#### Step 2.2: Voting Page Load
**URL**: `https://[domain].com/event/brave-blue-elephant`

**System Actions (Before Render)**:
1. Check for existing cookie_id
2. If no cookie exists:
   ```javascript
   const cookieId = generateUUID();
   setCookie('event_scheduler_user', cookieId, { maxAge: 365 * 24 * 60 * 60 });
   ```
3. Create user_cookies record:
   ```sql
   INSERT INTO user_cookies (cookie_id, event_id, is_organizer)
   VALUES ('[new-cookie-id]', 'brave-blue-elephant', false);
   ```
4. Check if this cookie_id already voted
5. Load event data and existing votes (if any)
6. Render appropriate view

**User Sees - First Time Visitor**:
- Event card with clean design:
  - Event title (prominent)
  - Location (if provided)
  - Invitation message: "[Organizer] invited you"
  - Question prompt: "What time can you make it?"
- Time slots list:
  - Each time slot displayed as card/row
  - Shows: Day, Date, Time, Label
  - Example: "Saturday, Oct 12 at 10:00 AM - Saturday Morning"
  - Three action buttons per slot:
    - "✓ I can make it" (primary, green)
    - "? Maybe" (secondary, yellow/orange)
    - "✗ Can't make it" (tertiary, red/gray)
- Optional: "Your name" input field
  - Placeholder: "Anonymous (optional)"
  - Small text: "Help others identify you"
- Submit button: "Submit My Availability"
  - Disabled until at least one vote cast
  - Shows count: "3 of 3 times voted"

**User Sees - Returning Visitor (Already Voted)**:
- Same layout but:
  - Previously selected votes are highlighted
  - Submit button text: "Update My Votes"
  - Additional info: "You responded [time ago]"
  - Can modify any vote and resubmit

---

#### Step 2.3: Voting Interaction
**User Actions**:
1. Scrolls through time slots
2. For each time slot, clicks one of three options:
   - "I can make it" (available)
   - "Maybe" (maybe)
   - "Can't make it" (unavailable)
3. Selection is immediately highlighted
4. Can change selection by clicking different option
5. Optionally enters display name
6. Clicks "Submit My Availability" when done

**UI Feedback**:
- Selected option highlights immediately
- Unselected options in same slot dim slightly
- Submit button enables when all slots have votes
- Counter updates: "3 of 3 times voted"
- Smooth animations on selection

**Validation**:
- Must vote on all time slots before submitting
- Display name is optional (defaults to "Anonymous")
- No special validation on name field

---

#### Step 2.4: Vote Submission
**User Actions**:
- Clicks "Submit My Availability" button

**System Actions**:
1. Validate all time slots have votes
2. Prepare vote data:
   ```javascript
   const votes = [
     { timeslot_id: 'slot-1-uuid', availability: 'available' },
     { timeslot_id: 'slot-2-uuid', availability: 'maybe' },
     { timeslot_id: 'slot-3-uuid', availability: 'unavailable' }
   ];
   ```
3. Submit to API:
   ```javascript
   POST /api/events/brave-blue-elephant/vote
   {
     cookie_id: '[user-cookie-id]',
     display_name: 'Sarah' || null,
     votes: [...]
   }
   ```
4. Backend processes UPSERT for each vote:
   ```sql
   INSERT INTO votes (timeslot_id, cookie_id, availability)
   VALUES ($1, $2, $3)
   ON CONFLICT (timeslot_id, cookie_id)
   DO UPDATE SET 
     availability = EXCLUDED.availability,
     updated_at = NOW();
   ```
5. Update display_name if provided:
   ```sql
   UPDATE user_cookies
   SET display_name = $1, last_active = NOW()
   WHERE cookie_id = $2 AND event_id = $3;
   ```

**Loading State**:
- Submit button shows spinner
- Text changes to "Submitting..."
- Disable all inputs
- Duration: 1-2 seconds

---

#### Step 2.5: Confirmation Screen
**User Sees**:
- Success message: "Thanks for voting!"
- Confirmation details:
  - "Your availability has been recorded"
  - List of their votes (recap):
    - "Saturday Morning - You can make it ✓"
    - "Saturday Afternoon - Maybe"
    - "Sunday Morning - Can't make it"
- Next steps message:
  - "[Organizer] will pick a time soon"
  - "You'll be able to see the final time here"
- Action buttons:
  - "Change My Votes" (returns to voting view)
  - "Bookmark This Page" (browser native bookmark)
- Optional: Current vote status summary
  - "3 people have voted so far"
  - Does NOT show who voted what (privacy)

**User Actions**:
- Option 1: Closes browser/app (done)
- Option 2: Clicks "Change My Votes" to modify
- Option 3: Bookmarks page to check back later
- Option 4: Shares link with others who weren't invited

---

### Success Criteria for Secondary Flow
- ✅ Vote submitted in < 30 seconds
- ✅ Zero authentication required
- ✅ Clear visual feedback on selections
- ✅ Confirmation of submission
- ✅ Ability to modify votes anytime
- ✅ Mobile-optimized, works in any browser

---

## 3. TERTIARY FLOW: Organizer Dashboard & Locking Time

**User Type**: Event Organizer  
**Entry Point**: Dashboard URL or navigation from share screen  
**Goal**: Review votes and lock in final meeting time  
**Estimated Time**: 2-3 minutes

### Step-by-Step Journey

#### Step 3.1: Dashboard with Votes
**URL**: `https://[domain].com/event/brave-blue-elephant/dashboard`

**User Sees - Active State (With Votes)**:

**Header Section**:
- Event title and location
- Status badge: "Active - 3 responses"
- Quick actions: Share, Copy Link, Cancel Event

**Response Overview**:
- Response count: "3 of 5 invited have responded"
  - Note: System estimates invites based on link shares (future feature)
  - For MVP: "3 people have responded"
- Participant list:
  - Avatar/initial + name (or "Anonymous")
  - Timestamp: "Voted 2 hours ago"
  - Status indicator: "Completed"
- "Send Reminder" button
  - Opens modal to send notification (future feature)
  - For MVP: Shows "Copy link to send reminder"

**Recommended Time Section** (Prominent):
- Large highlighted card
- Badge: "Best Option" or "Recommended"
- Time slot details:
  - Day, Date, Time, Label
  - "Saturday, Oct 12 at 10:00 AM"
- Vote breakdown visualization:
  - "3 can make it" (green)
  - "0 maybe" (yellow)
  - "0 can't make it" (red)
- Participant details:
  - "Sarah, Mike, Anonymous can make it"
- Primary CTA: "Lock In This Time"

**All Time Slots Section**:
- List of all proposed times
- Each shows:
  - Date, time, label
  - Vote breakdown (visual bar chart or counts)
  - Participant availability list
  - "Select This Time" button (secondary style)
- Sorted by: Most "available" votes first

**Algorithm for Recommendation**:
```javascript
// Recommend time with:
// 1. Most "available" votes
// 2. If tied, fewest "unavailable" votes
// 3. If still tied, earliest time

function getRecommendedTime(timeSlots, votes) {
  return timeSlots
    .map(slot => ({
      ...slot,
      available: countVotes(slot.id, 'available'),
      unavailable: countVotes(slot.id, 'unavailable')
    }))
    .sort((a, b) => {
      if (b.available !== a.available) return b.available - a.available;
      if (a.unavailable !== b.unavailable) return a.unavailable - b.unavailable;
      return a.start_time - b.start_time;
    })[0];
}
```

**User Actions**:
- Reviews vote breakdown for each time
- Considers recommended time
- Clicks "Lock In This Time" on recommended slot OR
- Selects different time by clicking "Select This Time"

---

#### Step 3.2: Lock Time Confirmation
**User Actions**:
- Clicks "Lock In This Time" on any time slot

**System Actions**:
- Show confirmation modal:

**Modal Content**:
- Header: "Lock in this time?"
- Selected time details displayed
- Warning message:
  - "This will finalize your event"
  - "All participants will be notified" (future feature)
  - "Saturday, Oct 12 at 10:00 AM"
- Vote summary: "3 people can make it"
- Two buttons:
  - "Cancel" (secondary, closes modal)
  - "Yes, Lock It In" (primary, destructive-ish style)

**User Actions**:
- Option 1: Clicks "Cancel" → Modal closes, returns to dashboard
- Option 2: Clicks "Yes, Lock It In" → Proceeds to lock

---

#### Step 3.3: Time Locking Process
**System Actions**:
1. Validate organizer permission (check cookie_id)
2. Update event record:
   ```sql
   UPDATE events
   SET 
     locked_time_id = '[selected-timeslot-id]',
     status = 'locked'
   WHERE event_id = 'brave-blue-elephant';
   ```
3. Log event activity (analytics)
4. Trigger notifications (future feature)
5. Redirect to confirmation screen

**Loading State**:
- Modal shows spinner
- Text: "Locking in time..."
- Duration: 1-2 seconds

---

#### Step 3.4: Event Locked Confirmation
**URL**: `https://[domain].com/event/brave-blue-elephant` (now shows locked state)

**User Sees**:
- Success animation (confetti, checkmark)
- Large confirmation message: "It's official!"
- Event details card:
  - Event title
  - 🗓️ **Final Date & Time** (prominent)
  - 📍 Location (if provided)
  - Status badge: "Confirmed"

**Who's Going Section**:
- List of participants who voted "available" for locked time
- Shows: Name (or Anonymous) + avatar
- Count: "3 people are going"
- Note: People who voted "maybe" or "unavailable" not shown (or shown separately)

**Next Steps Section**:
- "Add to Calendar" button
  - Generates .ics file
  - Works with Google Calendar, Apple Calendar, Outlook
- "Get Directions" button (if location provided)
  - Opens in Google Maps / Apple Maps
  - Format: `https://maps.google.com/?q=[location]`
- "Message the Group" button (future feature)
  - Opens group chat thread
  - MVP: Shows "Copy link to share confirmation"

**Future Enhancements Section** (Design only, not functional):
- Weather widget: "Sunny, 72°F"
- Countdown: "5 days until event"
- Related suggestions: "Need a restaurant? See nearby options"

**User Actions**:
- Adds event to personal calendar
- Gets directions to location
- Shares confirmation with group
- Closes browser (done!)

---

### Success Criteria for Tertiary Flow
- ✅ Clear recommendation algorithm
- ✅ Easy vote visualization
- ✅ Smooth locking process
- ✅ Confirmation screen with next steps
- ✅ Calendar export functionality
- ✅ No confusion about final decision

---

## 4. SUPPORTING FLOW: Vote Modification

**User Type**: Participant who already voted  
**Entry Point**: Returns to event URL  
**Goal**: Change previously submitted votes  
**Estimated Time**: 15-20 seconds

### Step-by-Step Journey

#### Step 4.1: Return Visit Detection
**URL**: `https://[domain].com/event/brave-blue-elephant`

**System Actions**:
1. Check cookie_id in browser
2. Query existing votes:
   ```sql
   SELECT v.*, ts.start_time, ts.label
   FROM votes v
   JOIN time_slots ts ON v.timeslot_id = ts.timeslot_id
   WHERE v.cookie_id = '[user-cookie-id]'
   AND ts.event_id = 'brave-blue-elephant';
   ```
3. If votes exist, load them into UI
4. Render voting page with pre-selected options

**User Sees**:
- Same voting interface as initial vote
- All previous selections are highlighted
- Banner at top: "You've already voted"
- Info message: "You can change your votes anytime"
- Submit button text: "Update My Votes"
- Link: "View current results" (if organizer enabled public results)

---

#### Step 4.2: Modification Process
**User Actions**:
- Changes one or more votes by clicking different options
- Modified slots show subtle indicator (e.g., "Updated" badge)
- Clicks "Update My Votes"

**System Actions**:
- Same UPSERT logic as initial submission
- ON CONFLICT updates existing records
- Updates `updated_at` timestamp
- Returns success confirmation

**User Sees**:
- Updated confirmation screen
- Message: "Your votes have been updated"
- Recap of new votes
- Same confirmation options as initial vote

---

### Success Criteria
- ✅ Previous votes load correctly
- ✅ Changes save successfully
- ✅ Clear indication of "already voted" state
- ✅ No accidental double-voting
- ✅ Updated timestamp tracked

---

## 5. SUPPORTING FLOW: Event Cancellation

**User Type**: Event Organizer  
**Entry Point**: Dashboard  
**Goal**: Cancel event and clean up data  
**Estimated Time**: 10 seconds

### Step-by-Step Journey

#### Step 5.1: Cancellation Initiation
**User Actions**:
- From dashboard, clicks "Cancel Event" button (destructive style)

**System Actions**:
- Show confirmation modal

**Modal Content**:
- Header: "Cancel this event?"
- Warning icon
- Message:
  - "This will permanently delete the event"
  - "All votes and data will be lost"
  - "Participants will see 'Event Cancelled' if they visit"
- Two buttons:
  - "Never Mind" (primary, safe action)
  - "Yes, Cancel Event" (secondary, destructive style)

---

#### Step 5.2: Cancellation Process
**User Actions**:
- Clicks "Yes, Cancel Event"

**System Actions**:
1. Update event status:
   ```sql
   UPDATE events
   SET status = 'cancelled'
   WHERE event_id = 'brave-blue-elephant';
   ```
2. Or optionally hard delete (CASCADE deletes all related data):
   ```sql
   DELETE FROM events
   WHERE event_id = 'brave-blue-elephant';
   -- Cascade deletes time_slots, user_cookies, votes
   ```
3. Show confirmation
4. Redirect to landing page or cancellation confirmation

**User Sees**:
- Confirmation message: "Event cancelled"
- Brief explanation of what happens next
- Link to create new event
- No way to undo (deliberate design choice)

**Participant Experience**:
- If they visit cancelled event URL:
  - Shows: "This event was cancelled by the organizer"
  - No vote data visible
  - Link to homepage

---

### Success Criteria
- ✅ Clear warning before cancellation
- ✅ Proper data cleanup
- ✅ Graceful participant experience
- ✅ No orphaned database records

---

## 6. EDGE CASES & ERROR HANDLING

### 6.1 Event Not Found
**Trigger**: User visits `/event/invalid-id`

**User Sees**:
- 404 page with friendly message
- "Oops! This event doesn't exist"
- Possible reasons:
  - Link was typed incorrectly
  - Event was cancelled
  - Link expired
- CTA: "Create Your Own Event"

---

### 6.2 Event Already Locked
**Trigger**: Participant visits event that's already been locked

**User Sees**:
- Event locked state (same as organizer confirmation)
- Final date/time displayed prominently
- Message: "The time has been set!"
- If they didn't vote: "Sorry, voting is closed"
- If they voted "available": "See you there!"
- If they voted "maybe/unavailable": "Hope you can make it!"
- Actions still available:
  - Add to calendar
  - Get directions
  - View who's going

---

### 6.3 No JavaScript / Cookies Disabled
**Trigger**: User has JavaScript disabled or blocks cookies

**Fallback Behavior**:
- Show error message:
  - "This app requires cookies to function"
  - "Please enable cookies in your browser settings"
  - Brief explanation of why cookies are needed
- Optionally: Basic HTML form submission fallback
  - Vote data submitted via POST
  - Session stored server-side temporarily
  - Less optimal UX but functional

---

### 6.4 Expired/Old Event
**Trigger**: Event TTL has passed (90+ days old)

**System Actions**:
- Automated cleanup job runs daily
- Deletes events where `ttl < NOW()`
- CASCADE deletes all related data

**User Sees**:
- Same as 404: "This event has expired"
- Message: "Events are automatically deleted after 90 days"
- No way to recover

---

### 6.5 Network Error During Submission
**Trigger**: API request fails during vote/creation

**System Actions**:
- Show error toast/message
- Message: "Oops! Something went wrong. Please try again."
- Retry button
- Data preserved in form (no loss)

**Technical Implementation**:
```javascript
try {
  await submitVotes(data);
} catch (error) {
  showToast('Connection error. Please try again.', 'error');
  enableRetry();
  // Data remains in state
}
```

---

### 6.6 Duplicate Event ID Generated
**Trigger**: Extremely rare collision in unique-names-generator

**System Actions**:
- Check for existing event_id before INSERT
- If collision detected:
  ```javascript
  while (eventIdExists(generatedId)) {
    generatedId = generateNewEventId();
  }
  ```
- Retry with new ID
- Log collision for monitoring
- User never sees error (handled silently)

**Probability**: ~1 in 50 million with 3-word combinations

---

### 6.7 Mobile App / In-App Browser Issues
**Trigger**: User opens link in Instagram/Facebook in-app browser

**Known Issues**:
- Some in-app browsers have strict cookie policies
- May not persist cookies across sessions

**Mitigation**:
- Detect in-app browser via user agent
- Show banner: "For best experience, open in Safari/Chrome"
- Provide "Open in Browser" button
- Use sessionStorage as backup for single session

---

## 7. NAVIGATION MAP

```
Landing Page (/)
    │
    ├─→ Create Event (/create)
    │       │
    │       ├─→ Time Selection
    │       ├─→ Event Details
    │       └─→ Share Screen (/event/[id]/share)
    │               │
    │               └─→ Organizer Dashboard (/event/[id]/dashboard)
    │                       │
    │                       ├─→ Lock Time (modal)
    │                       └─→ Confirmation (/event/[id])
    │
    └─→ Event URL (/event/[id])
            │
            ├─→ Voting Interface (participant)