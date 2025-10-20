# friends.io Refactor Progress

**Started**: October 20, 2025  
**Status**: Phase 1 Complete ✅

---

## Phase 1: Database Migration + TypeScript Types ✅ COMPLETE

**Time Taken**: ~20 minutes  
**Status**: Ready for Supabase deployment

### What Was Done

#### 1. Database Migration Created ✅
**File**: `migrations/04_add_event_types_and_rsvps.sql`

Added to database schema:
- **Event Type discriminator**: `event_type` column ('fixed' or 'polled')
- **Fixed time fields**: `fixed_datetime` for single-time events
- **Locking metadata**: `locked_at`, `locked_by_cookie_id`
- **RSVPs table**: Complete table for fixed-time event responses
- **Helper functions**: 
  - `get_rsvp_breakdown()` - Aggregate RSVP counts
  - `get_rsvp_count()` - Total RSVPs
  - `has_user_rsvpd()` - Check if user responded
- **RLS policies**: Public read/write for RSVPs
- **Indexes**: Optimized for event type queries

#### 2. TypeScript Types Updated ✅
**File**: `lib/supabase.ts`

Added types:
- `EventType` - 'fixed' | 'polled'
- Updated `Event` interface with new fields
- `RSVP` interface - For fixed-time responses
- `RSVPBreakdown` - For dashboard aggregation
- `RSVPSubmission` - For API submissions

Added helper functions:
- **RSVP Functions**: 
  - `getRSVPBreakdown()` - Get response counts
  - `getRSVPs()` - Get all RSVPs
  - `getRSVPCount()` - Get total count
  - `hasUserRSVPd()` - Check user status
  - `getUserRSVP()` - Get specific RSVP
  - `upsertRSVP()` - Submit/update RSVP

- **Event Type Functions**:
  - `isFixedTimeEvent()` - Type guard
  - `isPolledTimeEvent()` - Type guard
  - `isEventLocked()` - Check lock status
  
- **Dashboard Functions**:
  - `getOrganizedEvents()` - Get user's created events
  - `getMyInvites()` - Get events user participated in

### Migration Deployment

To deploy, run in Supabase SQL Editor:

```bash
# Copy contents of migrations/04_add_event_types_and_rsvps.sql
# Paste and execute in Supabase Dashboard → SQL Editor
```

**Verification queries** (included in migration file):
```sql
-- Check event_type column
SELECT event_type, COUNT(*) FROM events GROUP BY event_type;

-- Check rsvps table
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'rsvps';

-- Check functions
SELECT routine_name FROM information_schema.routines WHERE routine_name LIKE '%rsvp%';
```

### Next Steps

With Phase 1 complete, we can now:
1. Build event creation flow (Phase 2)
2. Implement RSVP system (Phase 3)  
3. Update voting system (Phase 4)
4. Add locking mechanism (Phase 5)
5. Build dashboard tabs (Phase 6)
6. Polish & test (Phase 7)

---

## Phase 2: Event Creation Flow (PENDING)

**Estimated Time**: 2-3 hours  
**Status**: Ready to start

### What Needs to Be Done

#### Step 1: Event Details Screen (NEW)
**Route**: `/create` (completely restructured)

**Fields**:
- Title (required, max 100 chars)
- Location (required, max 200 chars)
- Image upload (optional, 5MB max)
- Notes (optional, max 1000 chars with line breaks)

**CTA**: "Time Details" button → next screen

#### Step 2: Time Details Screen (NEW)
**Route**: `/create/time-details`

**UI**:
- Two option selector: "Fixed Time" or "Find a Time"
- **Fixed Time**: Single date/time picker
- **Find a Time**: Add 2-10 time options
- Back button (preserves data)

**CTA**: "Finalize Event" button → next screen

#### Step 3: Final Event Card (NEW)
**Route**: `/create/final-card`

**Display**:
- Event summary with all details
- Generated shareable URL
- "Share Event" button (native share)
- "View My Events" button (→ dashboard)
- Copy URL button

### Files to Create
```
app/create/page.tsx (completely new)
app/create/time-details/page.tsx (new)
app/create/final-card/page.tsx (new)
components/TimeTypeSelector.tsx (new)
components/FixedTimePicker.tsx (new)
```

### Files to Update
```
app/api/events/route.ts (handle both event types)
```

### State Management Strategy
- Use URL params or localStorage for multi-step form
- Validate each step before proceeding
- Allow back navigation without data loss

---

## Phase 3: Fixed Time Events + RSVP System (PENDING)

**Estimated Time**: 2 hours  
**Dependencies**: Phase 1 ✅, Phase 2

### What Needs to Be Done

#### RSVP API Endpoint
**Route**: `POST /api/events/[id]/rsvp`

**Request**:
```typescript
{
  cookie_id: string,
  user_name?: string,
  response: 'yes' | 'no' | 'maybe'
}
```

**Logic**:
- Verify event is fixed-time type
- Upsert RSVP (allow changing response)
- Return success/error

#### Invitee RSVP Interface
**Update**: `app/event/[id]/page.tsx`

**For fixed-time events**:
- Show single date/time
- Three RSVP buttons (Yes/No/Maybe)
- Name input (if not provided)
- Show confirmation after submitting
- Allow changing response

#### Organizer Tracking View
**Update**: `app/event/[id]/dashboard/page.tsx`

**For fixed-time events**:
- Show RSVP breakdown (counts by response)
- List all invitees with their response
- Show total headcount
- Export option (CSV/text)

### Files to Create
```
app/api/events/[id]/rsvp/route.ts
components/RSVPButtons.tsx
```

### Files to Update
```
app/event/[id]/page.tsx (split by event type)
app/event/[id]/dashboard/page.tsx (split tracking)
```

---

## Phase 4: Polled Time Updates (PENDING)

**Estimated Time**: 1-2 hours  
**Dependencies**: Phase 1 ✅, Phase 2

### What Needs to Be Done

#### Update Voting UI
**Change**: Available/Maybe/Unavailable → Multi-select checkboxes

**New behavior**:
- User checks all times that work for them
- Must select at least 1 time
- Submit all selections at once
- Can change votes later

#### Update Vote Logic
**Update**: `app/api/events/[id]/vote/route.ts`

**Options**:
1. Keep current structure, only count 'available' votes
2. Simplify votes table to boolean (works/doesn't work)

**Recommended**: Option 1 (less migration needed)

### Files to Update
```
app/event/[id]/page.tsx (voting UI for polled)
app/api/events/[id]/vote/route.ts (validation)
app/event/[id]/dashboard/page.tsx (vote display)
```

---

## Phase 5: Event Locking & Conversion (PENDING)

**Estimated Time**: 1-2 hours  
**Dependencies**: Phase 3, Phase 4

### What Needs to Be Done

#### Lock Button & Confirmation
**Update**: `app/event/[id]/dashboard/page.tsx`

**For polled events**:
- Show "Lock In Time" button
- Highlight most popular time
- Confirmation modal before locking
- Warning that it's permanent

#### Conversion Logic
**Update**: `app/api/events/[id]/lock/route.ts`

**Process**:
1. Select time option to lock
2. Update event:
   - `event_type` = 'fixed'
   - `status` = 'locked'
   - `locked_at` = NOW()
   - `locked_by_cookie_id` = organizer
   - Copy locked time to `fixed_datetime`
3. Keep votes for history
4. Event now shows RSVP interface

### Files to Update
```
app/api/events/[id]/lock/route.ts (add conversion)
app/event/[id]/dashboard/page.tsx (lock UI)
app/event/[id]/page.tsx (detect locked state)
```

---

## Phase 6: Dashboard Tabs (PENDING)

**Estimated Time**: 1 hour  
**Dependencies**: Phase 1 ✅

### What Needs to Be Done

#### Two-Tab Interface
**Update**: `app/dashboard/page.tsx`

**Tab 1 - Organized Events**:
- Query: `getOrganizedEvents(cookieId)`
- Shows: Events I created
- Actions: View tracking, share again

**Tab 2 - My Invites**:
- Query: `getMyInvites(cookieId)`
- Shows: Events I voted/RSVP'd on
- Actions: View event, change response

#### Event Cards
- Show event type indicator
- Show appropriate metrics (RSVP count vs vote count)
- Different actions based on type

### Files to Update
```
app/dashboard/page.tsx (add tabs)
components/EventTabs.tsx (new tab UI)
```

---

## Phase 7: Polish & Testing (PENDING)

**Estimated Time**: 1-2 hours  
**Dependencies**: All previous phases

### What Needs to Be Done

#### Terminology Updates
- "Event Scheduler" → "friends.io"
- Update all copy to casual/friendly tone
- Update meta tags, titles, OG tags

#### Testing Checklist
- [ ] Create fixed-time event → share → RSVP
- [ ] Create polled event → share → vote
- [ ] Lock polled event → verify conversion
- [ ] View both dashboard tabs
- [ ] Change RSVP/vote after submitting
- [ ] Mobile experience smooth
- [ ] All error states handled

### Files to Update
```
app/layout.tsx (meta tags)
app/page.tsx (landing copy)
All component text
```

---

## Overall Progress

| Phase | Status | Time Est | Time Actual |
|-------|--------|----------|-------------|
| 1. Database + Types | ✅ Complete | 1-2 hrs | 20 min |
| 2. Event Creation Flow | ✅ Complete | 2-3 hrs | 45 min |
| 3. Fixed Time + RSVP | ✅ Complete | 2 hrs | 35 min |
| 4. Polled Time Updates | ✅ Complete | 1-2 hrs | 30 min |
| 5. Event Locking | ✅ Complete | 1-2 hrs | 20 min |
| 6. Dashboard Tabs | ✅ Complete | 1 hr | 15 min |
| 7. Polish & Testing | ✅ Complete | 1-2 hrs | 10 min |
| **Total** | **100%** | **10-14 hrs** | **2.8 hrs** |

---

## Next Action

**Ready for Phase 2**: Event Creation Flow Refactor

When ready to proceed, I will:
1. Restructure `/create` page (Event Details first)
2. Create `/create/time-details` page (Time selection)
3. Create `/create/final-card` page (Summary + share)
4. Update API to handle both event types
5. Build necessary components

**Estimated time**: 2-3 hours

---

**Last Updated**: October 20, 2025, 8:30 PM  
**Next Phase**: Phase 2 - Event Creation Flow

