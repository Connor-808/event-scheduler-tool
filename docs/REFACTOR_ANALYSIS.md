# Refactor Analysis: Current → friends.io

**Date**: October 20, 2025  
**Scope**: Complete UX and codebase refactor to match new PRD and user flow

---

## Executive Summary

**Refactor Type**: MAJOR - Significant UX restructuring and new event type  
**Estimated Effort**: 8-12 hours  
**Risk Level**: MEDIUM - Core flow changes but database structure mostly compatible  
**Breaking Changes**: YES - Event creation flow completely restructured

---

## Key Changes Required

### 1. Event Type System (NEW FEATURE) ⭐

**Current**: Only "Find a Time" (polling with available/maybe/unavailable)  
**New**: Two distinct event types:

| Feature | Fixed Time Event | Polled Time Event |
|---------|-----------------|-------------------|
| Time Selection | Single date/time | Multiple options (2-10) |
| Response Type | RSVP (Yes/No/Maybe) | Multi-select votes |
| Dashboard View | RSVP tracking | Vote counts + Lock button |
| Conversion | N/A | Can lock → becomes Fixed Time |

**Impact**: 
- Add `event_type` field to database: `'fixed'` or `'polled'`
- Split voting logic into two systems
- Add RSVP table/system for fixed events
- Add locking mechanism for polled events

---

### 2. Event Creation Flow (MAJOR RESTRUCTURE) 🔄

**Current Flow**:
```
Landing → Create Page (Time Slots First) → Event Details → Share
```

**New Flow**:
```
Landing → Event Details (Title/Location/Image/Notes) → Time Details (Choose Fixed/Polled) → Final Event Card → Share
```

**Changes Needed**:
- Reverse form order: details first, time second
- Split into two distinct screens
- Add "Time Details" intermediate screen
- Create "Final Event Card" summary page
- Remove preset time slot options
- Add time type selection UI

**Files to Update**:
- `app/create/page.tsx` - Complete restructure
- Create new: `app/create/time-details/page.tsx`
- Create new: `app/create/final-card/page.tsx`
- Update: `app/api/events/route.ts`

---

### 3. RSVP System for Fixed Time Events (NEW) ✨

**Current**: Only vote system (available/maybe/unavailable)  
**New**: Need separate RSVP system (Yes/No/Maybe)

**Database Changes**:
```sql
-- New table for RSVPs
CREATE TABLE rsvps (
  rsvp_id UUID PRIMARY KEY,
  event_id TEXT REFERENCES events(event_id),
  user_cookie_id UUID,
  user_name TEXT,
  response TEXT CHECK (response IN ('yes', 'no', 'maybe')),
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

**Files to Create**:
- `app/api/events/[id]/rsvp/route.ts` - RSVP submission
- Update: `app/event/[id]/page.tsx` - Show RSVP UI for fixed events

---

### 4. Multi-Select Voting (UPDATE) 🗳️

**Current**: One vote per time slot (available/maybe/unavailable)  
**New**: Multi-select checkboxes (user picks all times that work)

**Changes**:
- Votes table: Change `availability` to boolean (works/doesn't work)
- Or: Keep current structure but only use 'available' for "this works"
- UI: Replace three-button voting with checkboxes
- Validation: Must select at least 1 time

**Files to Update**:
- `app/event/[id]/page.tsx` - Update voting UI
- `app/api/events/[id]/vote/route.ts` - Update vote logic
- `app/event/[id]/dashboard/page.tsx` - Update vote display

---

### 5. Event Locking & Conversion (NEW) 🔒

**Current**: `locked_time_id` marks final time but stays same event type  
**New**: Locking converts polled → fixed time event

**Logic**:
1. Organizer clicks "Lock In Time" on polled event
2. Select which time option to lock
3. Event converts:
   - `event_type` changes from `'polled'` to `'fixed'`
   - `locked_time_id` stores the selected time
   - `status` changes to `'locked'`
4. All existing votes preserved for history
5. New share URL shows RSVP interface
6. Dashboard shows RSVP tracking

**Files to Update**:
- `app/api/events/[id]/lock/route.ts` - Add conversion logic
- `app/event/[id]/dashboard/page.tsx` - Show lock UI
- `app/event/[id]/page.tsx` - Detect locked state

---

### 6. Dashboard Two-Tab System (RESTRUCTURE) 📊

**Current**: Single "My Events" (organized only)  
**New**: Two tabs with different data

| Tab | Shows | Data Source |
|-----|-------|-------------|
| Organized Events | Events I created | Filter by organizer cookie |
| My Invites | Events I voted/RSVP'd on | Filter by user_cookies participation |

**Changes**:
- Add tab navigation UI
- Query logic for "My Invites" (where I've responded but not organizer)
- Show appropriate tracking for each event type
- Different actions per tab

**Files to Update**:
- `app/dashboard/page.tsx` - Add tabs, split queries
- `lib/supabase.ts` - Add getMyInvites() query

---

### 7. Invitee Views by Event Type (SPLIT) 👥

**Current**: One voting interface (available/maybe/unavailable)  
**New**: Two different interfaces

**Fixed Time Event View**:
- Show single time
- RSVP buttons (Yes/No/Maybe)
- Simple name input
- Show who else is attending (optional)

**Polled Time Event View**:
- Show all time options
- Checkboxes to select working times
- Must select at least 1
- Show vote counts (if organizer allows)
- After locking: Redirect to RSVP view

**Files to Update**:
- `app/event/[id]/page.tsx` - Split into two UIs based on event type

---

### 8. Tracking Views (UPDATE) 📈

**Fixed Time Tracking**:
- Show RSVP breakdown (Yes/No/Maybe/No Response)
- List all invitees with their response
- Total headcount
- Export guest list option

**Polled Time Tracking** (mostly exists):
- Show vote counts per time option
- Highlight most popular time
- "Lock In Time" button
- After locking: Shows final time + RSVP tracking

**Files to Update**:
- `app/event/[id]/dashboard/page.tsx` - Split view based on event type

---

### 9. Terminology & Branding (GLOBAL) 🎨

**Changes**:
- "Event Scheduler" → "friends.io"
- Update all UI copy to casual, friendly tone
- "Time slots" → "Time options"
- "Vote" → appropriate context (vote for polled, RSVP for fixed)
- Meta tags, titles, OG tags

**Files to Update**:
- `app/layout.tsx` - Meta tags
- `app/page.tsx` - Landing page copy
- All component text

---

## Database Schema Changes

### Required Additions

```sql
-- 1. Add event type to events table
ALTER TABLE events 
ADD COLUMN event_type TEXT CHECK (event_type IN ('fixed', 'polled')) DEFAULT 'polled';

-- 2. For fixed events, add single time fields
ALTER TABLE events
ADD COLUMN fixed_date DATE,
ADD COLUMN fixed_time TIME;

-- 3. Create RSVPs table for fixed time events
CREATE TABLE rsvps (
  rsvp_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT NOT NULL REFERENCES events(event_id) ON DELETE CASCADE,
  cookie_id UUID NOT NULL,
  user_name TEXT,
  response TEXT NOT NULL CHECK (response IN ('yes', 'no', 'maybe')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  FOREIGN KEY (cookie_id, event_id) REFERENCES user_cookies(cookie_id, event_id),
  UNIQUE(cookie_id, event_id)
);

CREATE INDEX idx_rsvps_event ON rsvps(event_id);
CREATE INDEX idx_rsvps_response ON rsvps(event_id, response);

-- 4. Update votes for polled events (already exists, may need adjustment)
-- Current votes table works but consider simplifying to just "available" votes

-- 5. Add locking metadata
ALTER TABLE events
ADD COLUMN locked_at TIMESTAMPTZ,
ADD COLUMN locked_by_cookie_id UUID;
```

### Migration Strategy

1. Add new columns with defaults (won't break existing data)
2. Mark all existing events as `event_type = 'polled'`
3. Create new tables
4. Deploy code
5. Test both event types

---

## Implementation Order

### Phase 1: Database & Core Types (1-2 hours)

**Priority**: CRITICAL  
**Blockers**: Everything depends on this

- [ ] Create migration SQL file
- [ ] Add event type discriminator
- [ ] Create RSVPs table
- [ ] Update TypeScript types in `lib/supabase.ts`
- [ ] Add helper queries for RSVPs

### Phase 2: Event Creation Flow (2-3 hours)

**Priority**: HIGH  
**Dependencies**: Phase 1

- [ ] Create multi-step form state management
- [ ] Build Event Details screen (Step 1)
- [ ] Build Time Details screen (Step 2) with type selector
- [ ] Build Final Event Card screen (Step 3)
- [ ] Update API to handle both event types
- [ ] Add form validation

### Phase 3: Fixed Time Events (2 hours)

**Priority**: HIGH  
**Dependencies**: Phase 1, 2

- [ ] Create RSVP submission API endpoint
- [ ] Build RSVP interface for invitees
- [ ] Build RSVP tracking view for organizers
- [ ] Add confirmation messages
- [ ] Test RSVP flow end-to-end

### Phase 4: Polled Time Updates (1-2 hours)

**Priority**: HIGH  
**Dependencies**: Phase 1

- [ ] Update voting UI to multi-select checkboxes
- [ ] Update vote submission logic
- [ ] Add "at least 1" validation
- [ ] Update dashboard tracking view
- [ ] Test voting flow

### Phase 5: Event Locking/Conversion (1-2 hours)

**Priority**: MEDIUM  
**Dependencies**: Phase 3, 4

- [ ] Build lock confirmation modal
- [ ] Implement conversion logic in API
- [ ] Update event display after locking
- [ ] Test conversion flow
- [ ] Handle edge cases

### Phase 6: Dashboard Tabs (1 hour)

**Priority**: MEDIUM  
**Dependencies**: Phase 3, 4

- [ ] Create tab navigation UI
- [ ] Add "My Invites" query
- [ ] Split event displays by type
- [ ] Test data fetching
- [ ] Handle empty states

### Phase 7: Polish & Testing (1-2 hours)

**Priority**: LOW  
**Dependencies**: All phases

- [ ] Update all copy/terminology
- [ ] Update meta tags and branding
- [ ] Test all user flows
- [ ] Fix edge cases
- [ ] Performance check

---

## Files to Create

```
migrations/
  └── 04_add_event_types_and_rsvps.sql

app/
  └── create/
      ├── page.tsx (Event Details - Step 1)
      ├── time-details/
      │   └── page.tsx (Time Selection - Step 2)
      └── final-card/
          └── page.tsx (Summary - Step 3)
  └── api/
      └── events/
          └── [id]/
              └── rsvp/
                  └── route.ts

components/
  ├── RSVPButtons.tsx
  ├── TimeTypeSelector.tsx
  └── EventTabs.tsx

lib/
  └── types/
      └── events.ts (consolidated types)
```

## Files to Update Significantly

```
app/
  ├── event/[id]/
  │   ├── page.tsx (split by event type)
  │   └── dashboard/
  │       └── page.tsx (split tracking views)
  ├── dashboard/
  │   └── page.tsx (add tabs)
  └── page.tsx (update landing copy)

app/api/
  └── events/
      ├── route.ts (handle both event types)
      └── [id]/
          ├── vote/route.ts (update for multi-select)
          └── lock/route.ts (add conversion)

lib/
  └── supabase.ts (add RSVP queries, update types)
```

---

## Risk Assessment

### High Risk Items
1. **Event creation flow reversal** - Complete UX change, users may be confused
2. **Database migration** - Must handle existing events gracefully
3. **Two voting systems** - Complexity in maintaining both RSVP + voting

### Mitigation Strategies
1. Clear messaging and UI guidance through new flow
2. Default existing events to 'polled' type, add migration with testing
3. Separate code paths clearly, extensive testing

### Rollback Plan
1. Keep old migration in git history
2. Ensure database changes are additive (no drops)
3. Feature flags for event type switching if needed

---

## Testing Strategy

### Unit Tests Needed
- Event type discrimination logic
- RSVP submission validation
- Vote submission with multi-select
- Lock/conversion logic
- Dashboard query filters

### Integration Tests
- Complete Fixed Time event flow
- Complete Polled Time event flow
- Event locking and conversion
- Dashboard tabs switching
- Share URL generation

### User Acceptance Testing
- Create fixed time event → share → RSVP
- Create polled event → share → vote → lock → RSVP
- View both tab types in dashboard
- Change RSVP/vote after submitting

---

## Success Criteria

**Must Have**:
- [ ] Both event types work end-to-end
- [ ] No data loss during migration
- [ ] All PRD requirements implemented
- [ ] Mobile experience is smooth
- [ ] No critical bugs

**Nice to Have**:
- Desktop optimization
- Animations between flow steps
- Advanced empty states
- Export functionality

---

## Next Steps

1. ✅ Review this analysis
2. Get approval on approach
3. Create database migration
4. Begin Phase 1 implementation
5. Test after each phase
6. Deploy incrementally if possible

---

**Estimated Total Time**: 10-14 hours  
**Recommended Approach**: Implement in phases, test thoroughly  
**Status**: Ready to begin Phase 1

