# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Event Scheduler is a frictionless, mobile-first event scheduling application that enables groups to coordinate plans through voting on times without requiring user accounts (cookie-based identification for voters, optional phone auth for organizers). Built as "Calendly without the corporate nature."

**Tech Stack:**
- Next.js 15 with App Router (TypeScript)
- Supabase (PostgreSQL + real-time subscriptions)
- Tailwind CSS 4
- Twilio (SMS notifications)
- Mapbox (location search)

## Common Commands

### Development
```bash
npm run dev          # Start dev server with Turbopack (http://localhost:3000)
npm run build        # Build for production with Turbopack
npm start            # Run production server
npm run lint         # Run ESLint
```

### Testing
Follow the TESTING_GUIDE.md for comprehensive testing instructions covering:
- Phone authentication flow
- Cookie-based anonymous voting
- Event creation and dashboard

## Architecture Overview

### Dual Authentication System

**Anonymous Voting (Cookie-based):**
- Participants don't need accounts
- UUID stored in browser cookie (`event_scheduler_user`)
- Cookie persists for 365 days
- See `lib/utils.ts` for cookie management functions

**Organizer Authentication (Optional Phone Auth):**
- Optional Supabase phone authentication for organizers
- Events can be created anonymously OR by authenticated users
- Authenticated organizers can view all their events in dashboard
- See `lib/auth.ts` for phone OTP functions

### Database Schema

Four core entities in Supabase PostgreSQL:

1. **events** - Core event entity
   - `event_id` (PK, TEXT): Generated via unique-names-generator (e.g., "brave-blue-elephant")
   - `organizer_user_id` (UUID, nullable): Links to auth.users for authenticated organizers
   - `locked_time_id` (UUID, nullable): References final locked time slot
   - `status`: 'active' | 'locked' | 'cancelled'

2. **time_slots** - Proposed meeting times
   - Belongs to event (CASCADE delete)
   - Has start_time, optional end_time, optional label

3. **user_cookies** - Anonymous participants
   - Composite PK: (cookie_id, event_id)
   - `is_organizer` flag for first cookie that creates event
   - Optional display_name

4. **votes** - Participant availability
   - `availability`: 'available' | 'maybe' | 'unavailable'
   - UNIQUE constraint on (timeslot_id, cookie_id) enables UPSERT pattern

See SCHEMA.md for full ERD and detailed schema information.

### Key Patterns

**Event ID Generation:**
```typescript
// lib/utils.ts - generateEventId()
// Format: adjective-color-animal (e.g., "brave-blue-elephant")
// Uses unique-names-generator library
```

**Cookie Management:**
```typescript
// lib/utils.ts
getUserCookieId()  // Get existing or create new UUID cookie
setCookie()        // Set cookie with options
getCookie()        // Read cookie value
```

**Database Queries:**
```typescript
// lib/supabase.ts
getEventWithDetails()     // Full event with time slots and participants
getVoteBreakdown()        // Vote counts per time slot, sorted by popularity
getRecommendedTime()      // Time slot with most "available" votes
upsertVotes()            // Insert or update votes (handles conflicts)
```

### API Routes Structure

All API routes in `app/api/`:

**Events:**
- `POST /api/events` - Create event (requires: title, timeSlots, cookieId)
- `GET /api/events/[id]` - Get event details
- `POST /api/events/[id]/vote` - Submit/update votes
- `POST /api/events/[id]/lock` - Lock time (organizer only)
- `POST /api/events/[id]/lock-in` - Finalize event
- `POST /api/events/[id]/request-verification` - Request phone verification
- `POST /api/events/[id]/verify-code` - Verify phone code

**Utilities:**
- `POST /api/upload-image` - Upload event hero images
- `GET /api/search-places` - Mapbox location search

### Page Routes

**Public Pages:**
- `/` - Landing page with "Create Event" CTA
- `/event/[id]` - Voting interface (anonymous, cookie-based)
- `/event/[id]/share` - Share page after event creation
- `/create` - Event creation flow

**Authenticated Pages:**
- `/login` - Phone authentication (OTP)
- `/signup` - Phone registration
- `/dashboard` - View all events created by authenticated organizer
- `/event/[id]/dashboard` - Organizer dashboard for specific event

### Environment Variables

Required in `.env.local`:
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Twilio (SMS notifications)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=

# Mapbox (location search)
NEXT_PUBLIC_MAPBOX_TOKEN=
```

## Code Organization

### Directory Structure

```
app/
├── api/              # Next.js API routes (server-side)
├── (pages)/          # Page routes
├── layout.tsx        # Root layout (includes ThemeToggle)
└── globals.css       # Global styles (Tailwind)

lib/
├── supabase.ts       # Supabase client + TypeScript types + query helpers
├── auth.ts           # Phone authentication utilities
└── utils.ts          # Cookie management, event ID generation, date formatting

components/
├── ui/               # Reusable UI components
│   ├── button.tsx
│   ├── card.tsx
│   ├── input.tsx
│   ├── location-picker.tsx  # Mapbox integration
│   ├── modal.tsx
│   └── textarea.tsx
├── PhoneAuth.tsx
├── PhoneVerification.tsx
└── ThemeToggle.tsx   # Dark mode toggle
```

### Import Paths

Uses TypeScript path aliases:
```typescript
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
```

## Important Development Notes

### Real-time Updates

The app uses Supabase real-time subscriptions for live vote updates:
```typescript
// Client-side pattern for subscribing to vote changes
supabase
  .channel('event-votes')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'votes',
    filter: `timeslot_id=in.(${ids})`
  }, handleUpdate)
  .subscribe();
```

### Data Retention

Events have a 90-day TTL set on creation. See SCHEMA.md for cleanup function details.

### Organizer Permissions

Two ways to identify organizers:
1. **Cookie-based**: First cookie to create event has `is_organizer: true` in user_cookies
2. **Authenticated**: Event has `organizer_user_id` set to auth user ID

Always check both when verifying organizer access in API routes.

### Phone Number Formatting

Phone numbers must be in E.164 format for Twilio:
```typescript
// lib/auth.ts handles formatting automatically
// User input: "(555) 123-4567"
// Formatted: "+15551234567"
```

### Time Slot Recommendations

Algorithm in `lib/supabase.ts:getVoteBreakdown()`:
1. Sort by most "available" votes (descending)
2. Tiebreaker: fewest "unavailable" votes (ascending)
3. First result is recommended time

## Styling

### Tailwind CSS

Uses Tailwind CSS 4 with custom configuration:
- Dark mode support via `ThemeToggle.tsx` component
- Mobile-first responsive design
- No emoji usage (per PRD requirements)

### Design Principles

From PRD.md:
- Clean, uncluttered design
- Casual yet polished (not corporate)
- Mobile-first (responsive breakpoints: 320px, 768px, 1024px, 1440px)
- Touch targets minimum 44x44px
- High contrast for accessibility

## Documentation Files

- `PRD.md` - Complete product requirements
- `SCHEMA.md` - Full database schema and ERD
- `TESTING_GUIDE.md` - Step-by-step testing instructions
- `ORGANIZER_AUTH_COMPLETE.md` - Phone auth implementation details
- `SMS_NOTIFICATIONS_COMPLETE.md` - Twilio SMS integration
- `PHONE_AUTH_SETUP.md` - Phone authentication setup
- `HERO_IMAGE_SETUP.md` - Hero image implementation
- `MAPBOX_SETUP.md` - Mapbox location picker setup

## Key Constraints

1. **No login required for voting** - Anonymous participation is core to UX
2. **Cookie-based user identification** - 365-day persistence
3. **Mobile-first** - All features must work seamlessly on mobile
4. **Real-time updates** - Use Supabase subscriptions for live data
5. **Unique event IDs** - Always check for collisions with `eventExists()`
6. **Cascade deletes** - Removing events automatically cleans up related data
