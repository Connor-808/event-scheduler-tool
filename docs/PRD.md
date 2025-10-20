# Product Requirements Document: Event Scheduling App

## 1. Executive Summary

### Product Vision
A frictionless, mobile-first event scheduling application that enables groups to coordinate plans through voting on times and activities without requiring user accounts or authentication. The product eliminates the corporate friction of traditional scheduling tools while providing superior UX compared to text-based polling.

### Core Value Proposition
"Calendly without the corporate nature" - casual, easy, and free group scheduling that people actually want to use for social plans.

### Target Market
- Primary: Friend groups coordinating social activities (Gen Z and Millennials)
- Secondary: Casual acquaintances planning meetups
- Tertiary: Small informal group coordination

### Success Metrics
- Number of unique event links generated
- Completion rate (events that get a locked-in time)
- Viral coefficient (link shares per event)
- Monthly active event participation
- Revenue per user from ad monetization

## 2. Product Overview

### 2.1 Core Problem
Current research indicates that the primary user pain point is not discovering activities, but rather coordinating and locking in plans once decided. Users face friction with:
- Text-based polls that get lost in group chats
- Corporate scheduling tools (Calendly) that feel inappropriate for social contexts
- Complicated coordination that leads to plan abandonment

### 2.2 Solution
A lightweight, shareable event scheduling tool that:
- Requires zero authentication (cookie-based identification)
- Generates unique, shareable links for each event
- Provides voting interface for time selection
- Automatically recommends optimal meeting times
- Enables seamless mobile sharing to group chats

### 2.3 Key Differentiators
- No login required (cookie-based user identification)
- Mobile-first, beautifully designed interface
- Social-appropriate tone and UX (vs corporate tools)
- Viral sharing mechanism built into core flow
- Free to use with unobtrusive advertising

## 3. Technical Architecture

### 3.1 Technology Stack

**Frontend Framework**
- Next.js (React framework with server-side rendering)
- TypeScript for type safety
- Tailwind CSS for styling

**Backend & Database**
- Supabase (PostgreSQL database with real-time subscriptions)
- Supabase MCP for AI-assisted development
- Serverless functions via Next.js API routes

**Hosting & Deployment**
- AWS Amplify (hosting and CDN)
- GitHub Actions for CI/CD pipeline
- Automatic deployments on merge to main branch

**Key Libraries**
- unique-names-generator: Generate memorable event URLs (e.g., "big-red-donkey")
- Icon set: Solar icons from iconify.design
- Cookie management: Universal cookie library for user identification

### 3.2 Architecture Principles
- Serverless architecture for scalability
- Cookie-based sessions (no authentication system)
- Each event link creates isolated database instance
- Mobile-first responsive design
- Progressive web app capabilities

## 4. Data Model & Entity Relationship Diagram

### 4.1 Core Entities

**Event**
- event_id (PK, string): Unique identifier from unique-names-generator
- title (string): Event name/description
- location (string, optional): Place name or address
- location_details (JSON, optional): Additional location metadata
- created_at (timestamp): Event creation time
- locked_time_id (FK, nullable): Reference to locked time slot
- status (enum): 'active', 'locked', 'cancelled'
- ttl (timestamp, nullable): Time-to-live for data retention

**TimeSlot**
- timeslot_id (PK, UUID): Unique identifier
- event_id (FK): Reference to parent event
- start_time (timestamp): Proposed start time
- end_time (timestamp, optional): Proposed end time
- label (string, optional): "This weekend", "Weekday evening", etc.
- created_at (timestamp)

**UserCookie**
- cookie_id (PK, UUID): Unique identifier stored in browser cookie
- event_id (FK): Reference to event user is participating in
- display_name (string, optional): User-provided name
- created_at (timestamp): First visit timestamp
- last_active (timestamp): Most recent activity

**Vote**
- vote_id (PK, UUID): Unique identifier
- timeslot_id (FK): Reference to time slot
- cookie_id (FK): Reference to user cookie
- availability (enum): 'available', 'maybe', 'unavailable'
- created_at (timestamp)
- updated_at (timestamp)

### 4.2 Relationships
- Event (1) → TimeSlot (many)
- Event (1) → UserCookie (many)
- TimeSlot (1) → Vote (many)
- UserCookie (1) → Vote (many)
- Event (1) → TimeSlot (1, locked_time_id)

### 4.3 Indexes
- event_id on all tables for fast lookup
- cookie_id for user-specific queries
- (event_id, cookie_id) composite for vote retrieval

## 5. Feature Specifications

### 5.1 Landing Page

**Requirements**
- Clean, uncluttered design
- Single primary CTA: "Create an Event"
- Mobile-optimized layout
- No emoji usage
- Solar icon set throughout
- Fast load time (< 2 seconds)

**User Actions**
- Click "Create an Event" → Navigate to event creation flow
- View product description/value proposition
- Access help/FAQ (future enhancement)

### 5.2 Event Creation Flow

**Step 1: Time Selection**

Input Options:
1. Custom times (3-5 slots):
   - Date picker
   - Time picker
   - Optional end time
   - Add/remove time slots

2. Quick presets:
   - "This Weekend" (generates 3 time options)
   - "Next Weekend" (generates 3 time options)
   - "Weekday Evenings" (generates 3-5 options)

Technical Implementation:
- Preset logic generates actual datetime values
- Minimum 2 time slots required
- Maximum 10 time slots allowed

**Step 2: Event Details**
- Event title (required, max 100 characters)
- Location/place name (optional, max 200 characters)
- Additional notes (optional, max 500 characters)

**Step 3: Generate & Share**
- Generate unique event URL using unique-names-generator
  - Format: `app.domain.com/event/big-red-donkey`
  - Use dictionaries: adjectives, colors, animals
  - No underscores, use hyphens
- Create event record in database
- Display shareable link
- Native mobile share button with pre-populated message:
  - "Let's figure out when we can meet! Vote on your availability: [link]"
- Copy link button with confirmation
- Direct navigation to organizer dashboard

### 5.3 Voting Interface (Participant View)

**Page Load**
- Check for existing cookie_id
- If none exists, generate new cookie and store
- Create UserCookie record associated with event
- Load event details and time slots

**Display Elements**
- Event card with:
  - Event title
  - Location (if provided)
  - Organizer indicator: "[Name] invited you"
  - "What time can you make it?" prompt
- List of proposed time slots
- Vote buttons for each slot:
  - Available (primary action)
  - Maybe (secondary)
  - Can't make it (tertiary)

**User Actions**
- Select availability for each time slot
- Optional: Add display name
- Submit votes
- Return to modify votes at any time
- View current vote status

**Technical Notes**
- Real-time updates using Supabase subscriptions
- Cookie persists votes across sessions
- No page refresh needed for vote updates

### 5.4 Organizer Dashboard

**Access Control**
- First cookie_id to create event becomes "organizer"
- Organizer has special permissions
- Bookmark/save link for organizer access

**Display Sections**

1. **Response Overview**
   - Total invitees who responded
   - Response rate
   - List of participants (by display_name or "Anonymous")

2. **Recommended Time**
   - Algorithm: Time slot with most "Available" votes
   - Tiebreaker: Fewest "Can't make it" votes
   - Display vote breakdown for recommended time
   - Highlight recommended option

3. **All Time Slots**
   - Full vote breakdown for each time
   - Visual representation (bars/charts)
   - Click any time to view details

4. **Actions**
   - Lock in time (primary CTA)
     - Confirmation modal
     - Sets event status to 'locked'
     - Updates locked_time_id
   - Send reminder to non-responders
   - Copy event link
   - Cancel event

**Locked State**
- Display locked time prominently
- Show confirmation details
- Weather widget (future enhancement)
- Get directions button (future enhancement)
- Message to group (future enhancement)
- Final participant list

### 5.5 Confirmation Screen

**Post-Lock Display**
- Success message
- Final event details:
  - Locked date/time
  - Location
  - Who's going (list of participants)
- Action items:
  - Add to calendar (iCal/Google Calendar)
  - Get directions
  - Share confirmation

**Future Enhancements**
- Weather forecast for event time
- Group messaging thread
- Event reminders via notification
- AI-enhanced suggestions

## 6. User Journey Flows

### 6.1 Primary Flow: Organizer Creates Event

1. User lands on homepage
2. Clicks "Create an Event"
3. Selects time slots (custom or preset)
4. Adds event title and details
5. Clicks "Create Event"
6. System generates unique URL
7. User shares link via native share or copy
8. User navigates to organizer dashboard
9. Monitors responses as they come in
10. Reviews recommended time
11. Locks in final time
12. Views confirmation screen

**Success Criteria**: Event created and shared in < 60 seconds

### 6.2 Secondary Flow: Participant Votes

1. User receives shared link (via text, social, etc.)
2. Clicks link, lands on voting page
3. System generates cookie for user
4. User views event details
5. User votes on each time slot
6. Optionally adds display name
7. Submits votes
8. Views confirmation of submission
9. Can return anytime to update votes

**Success Criteria**: Vote submitted in < 30 seconds

### 6.3 Tertiary Flow: Plan Finalization

1. Organizer reviews all responses
2. Checks recommended time
3. Verifies participant availability
4. Locks in time
5. All participants receive update (future: notification)
6. Confirmation screen displayed
7. Participants can add to calendar

**Success Criteria**: Time locked with 80%+ participant satisfaction

## 7. Design Requirements

### 7.1 Visual Design Principles

**Brand Identity**
- Clean, modern aesthetic
- Casual yet polished
- No corporate feel
- Emphasis on usability over decoration

**Color Palette**
- Primary: TBD (vibrant, friendly)
- Secondary: TBD (complementary)
- Neutral grays for backgrounds
- High contrast for accessibility

**Typography**
- Sans-serif font family
- Clear hierarchy (H1, H2, body)
- Minimum 16px body text for mobile readability

**Iconography**
- Solar icon set from iconify.design
- Consistent stroke width
- 24px standard size
- NO EMOJI

### 7.2 Mobile-First Design

**Requirements**
- Responsive breakpoints: 320px, 768px, 1024px, 1440px
- Touch targets minimum 44x44px
- Single column layout on mobile
- Bottom-sheet modals for mobile actions
- Thumb-friendly navigation

**Performance**
- Image optimization
- Lazy loading for below-fold content
- Minimal JavaScript bundle size
- Progressive enhancement

### 7.3 Component Library

**Core Components**
- Button (primary, secondary, tertiary states)
- Input fields (text, date, time)
- Card container
- Modal/dialog
- Toast notifications
- Loading states
- Empty states

## 8. Technical Specifications

### 8.1 URL Structure

**Event Pages**
- Format: `https://[domain]/event/[unique-id]`
- Example: `https://pickatime.app/event/brave-blue-elephant`
- Unique ID generation using unique-names-generator
- Configuration:
  ```javascript
  {
    dictionaries: [adjectives, colors, animals],
    separator: '-',
    length: 3,
    style: 'lowerCase'
  }
  ```

### 8.2 Cookie Management

**Cookie Structure**
```javascript
{
  cookie_id: 'uuid-v4',
  created_at: 'timestamp',
  events: ['event-id-1', 'event-id-2']
}
```

**Cookie Settings**
- Name: `event_scheduler_user`
- MaxAge: 365 days
- SameSite: Lax
- Secure: true (production)
- HttpOnly: false (needs client-side access)

### 8.3 Database Schema (Supabase)

```sql
-- Events table
CREATE TABLE events (
  event_id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  location TEXT,
  location_details JSONB,
  locked_time_id UUID REFERENCES time_slots(timeslot_id),
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  ttl TIMESTAMPTZ
);

-- Time slots table
CREATE TABLE time_slots (
  timeslot_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id TEXT NOT NULL REFERENCES events(event_id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  label TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User cookies table
CREATE TABLE user_cookies (
  cookie_id UUID PRIMARY KEY,
  event_id TEXT NOT NULL REFERENCES events(event_id) ON DELETE CASCADE,
  display_name TEXT,
  is_organizer BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_active TIMESTAMPTZ DEFAULT NOW()
);

-- Votes table
CREATE TABLE votes (
  vote_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  timeslot_id UUID NOT NULL REFERENCES time_slots(timeslot_id) ON DELETE CASCADE,
  cookie_id UUID NOT NULL REFERENCES user_cookies(cookie_id) ON DELETE CASCADE,
  availability TEXT NOT NULL CHECK (availability IN ('available', 'maybe', 'unavailable')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(timeslot_id, cookie_id)
);

-- Indexes
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_time_slots_event ON time_slots(event_id);
CREATE INDEX idx_user_cookies_event ON user_cookies(event_id);
CREATE INDEX idx_votes_timeslot ON votes(timeslot_id);
CREATE INDEX idx_votes_cookie ON votes(cookie_id);
CREATE INDEX idx_votes_composite ON votes(timeslot_id, cookie_id);
```

### 8.4 API Routes (Next.js)

**Event Creation**
- `POST /api/events`
- Body: `{ title, location, timeSlots: [] }`
- Returns: `{ eventId, url }`

**Get Event Details**
- `GET /api/events/[eventId]`
- Returns: Event data, time slots, vote counts

**Submit Vote**
- `POST /api/events/[eventId]/vote`
- Body: `{ cookieId, votes: [{ timeslotId, availability }] }`
- Returns: Updated vote data

**Lock Time**
- `POST /api/events/[eventId]/lock`
- Body: `{ timeslotId, cookieId }`
- Validates: cookieId is organizer
- Returns: Updated event status

**Get Organizer Dashboard**
- `GET /api/events/[eventId]/dashboard`
- Returns: Full response data, vote breakdown, recommendations

### 8.5 Real-Time Updates

**Supabase Subscriptions**
- Subscribe to votes table for specific event
- Update UI when new votes arrive
- Show live participant count
- Real-time vote visualization updates

## 9. Monetization Strategy

### 9.1 Phase 1: Ad-Based Revenue

**Implementation**
- Display single, unobtrusive ad unit
- Placement: Bottom of voting page (non-intrusive)
- Format: Native ad or small banner
- Target: $0.01+ per event participation

**Projections**
- 100,000 users × 3 events/month = 300,000 events
- $0.01 per event = $3,000/month passive income

### 9.2 Phase 2: Premium Features (Future)

**Potential Premium Offerings**
- Remove ads ($2-3/month)
- Custom branding for events
- Advanced analytics
- Calendar integrations
- Automatic reminders
- Larger group support (50+ people)

## 10. Development Phases

### 10.1 MVP (Phase 1) - Week 1-2

**Core Features**
- Landing page with "Create Event" CTA
- Event creation flow (custom times only)
- Unique URL generation
- Cookie-based user identification
- Voting interface
- Basic organizer dashboard
- Lock time functionality
- Mobile-responsive design

**Technical Deliverables**
- Next.js app scaffolded
- Supabase database deployed
- AWS Amplify hosting configured
- GitHub CI/CD pipeline
- Basic analytics tracking

**Success Criteria**
- End-to-end flow functional
- Mobile-optimized
- < 2 second page loads
- Zero authentication friction

### 10.2 Enhancement Phase (Phase 2) - Week 3-4

**Features**
- Quick preset time options
- Improved organizer dashboard with charts
- Participant display names
- Copy link functionality
- Native share API integration
- Vote modification capability
- Send reminder feature

**Technical Improvements**
- Real-time vote updates (Supabase subscriptions)
- Performance optimization
- SEO optimization
- Error handling and edge cases

### 10.3 Growth Phase (Phase 3) - Month 2+

**Features**
- Ad integration
- Calendar export (iCal)
- Weather widget
- Directions integration
- Group messaging (future)
- AI suggestions (future)
- Analytics dashboard for organizers

**Marketing**
- Viral loop optimization
- Share message optimization
- Landing page A/B testing
- User testimonials

## 11. Success Metrics & KPIs

### 11.1 Engagement Metrics

**Primary**
- Events created per day/week/month
- Event completion rate (locked times)
- Average participants per event
- Vote submission rate

**Secondary**
- Time to create event (target: < 60 seconds)
- Time to submit vote (target: < 30 seconds)
- Return visitor rate
- Events per user

### 11.2 Growth Metrics

**Viral Coefficient**
- Average participants per event
- New event creation from shared links
- K-factor calculation

**Retention**
- 7-day retention rate
- 30-day retention rate
- Monthly active events

### 11.3 Revenue Metrics

**Phase 1 (Ads)**
- Ad impressions per event
- eCPM rates
- Revenue per event
- Monthly recurring revenue

**Phase 2 (Premium)**
- Free to paid conversion rate
- Monthly recurring revenue from subscriptions
- Churn rate

## 12. Risk Analysis & Mitigation

### 12.1 Technical Risks

**Risk: Database scaling issues**
- Mitigation: Supabase auto-scaling, connection pooling
- Monitor: Query performance, connection limits

**Risk: Cookie-based auth limitations**
- Mitigation: Clear user communication, optional display names
- Monitor: User confusion reports

**Risk: Unique ID collisions**
- Mitigation: 50M+ combinations, collision detection
- Monitor: Collision rates

### 12.2 Product Risks

**Risk: Low adoption / users prefer existing tools**
- Mitigation: Focus on UX differentiation, viral mechanics
- Monitor: Conversion rates, user feedback

**Risk: Privacy/safety concerns**
- Mitigation: Clear privacy policy, optional anonymity
- Monitor: User reports, feedback

**Risk: Spam/abuse of free platform**
- Mitigation: Rate limiting, TTL on events, report functionality
- Monitor: Abuse reports, suspicious patterns

### 12.3 Business Risks

**Risk: Insufficient monetization**
- Mitigation: Multiple revenue streams, premium features
- Monitor: Revenue per user, engagement metrics

**Risk: High infrastructure costs**
- Mitigation: Serverless architecture, efficient queries
- Monitor: AWS costs, Supabase usage

## 13. Future Roadmap

### 13.1 Q1 Enhancements
- Activity discovery integration (Moves module)
- Advanced calendar integrations
- Notification system
- Enhanced analytics

### 13.2 Q2 Features
- Group messaging within events
- AI-powered time suggestions
- Weather and local event data
- Premium tier launch

### 13.3 Q3+ Vision
- Native mobile apps (iOS/Android)
- Enterprise/team features
- API for third-party integrations
- White-label options

## 14. Appendices

### 14.1 Glossary
- **Cookie ID**: Browser-based identifier for anonymous users
- **Event ID**: Unique human-readable identifier for each event
- **Organizer**: First user to create the event (identified by cookie)
- **Time Slot**: Proposed meeting time that participants vote on
- **Vote**: User's availability indication for a specific time slot

### 14.2 References
- Next.js Documentation: https://nextjs.org/docs
- Supabase Documentation: https://supabase.com/docs
- unique-names-generator: https://github.com/andreasonny83/unique-names-generator
- Iconify Solar Icons: https://iconify.design/icon-sets/solar/

### 14.3 Document Control
- Version: 1.0
- Last Updated: 2025-10-08
- Owner: Connor Sweeney
- Technical Advisor: Michael Salzinger