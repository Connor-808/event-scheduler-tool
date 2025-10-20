# Product Requirements Document: friends.io

## Document Info
- **Product**: friends.io
- **Version**: 1.0
- **Last Updated**: October 20, 2025
- **Status**: Development
- **Related Docs**: `USER_FLOW.md`, `SCHEMA_ERD.md`

---

## Executive Summary

**Product Vision**: friends.io simplifies event scheduling among friends by providing a lightweight, mobile-first platform for creating events with either fixed times or flexible time-finding through group polling.

**Problem Statement**: Coordinating schedules among friends is friction-filled. Group chats become messy, availability gets lost in threads, and finding a time that works for everyone requires dozens of back-and-forth messages.

**Solution**: A dead-simple event creation and sharing flow that lets organizers either set a fixed time or poll multiple options, then share via a single link.

**Target Users**: 
- Friend groups coordinating casual hangouts (dinners, game nights, trips)
- Anyone organizing small social events (5-20 people)
- Mobile-first users who want quick scheduling without account creation barriers

---

## Goals & Success Metrics

### Primary Goals
1. Reduce time-to-event-creation to under 60 seconds
2. Enable frictionless RSVP/voting without mandatory signup
3. Provide clear visibility into who's available and when

### Success Metrics
- **Activation**: % of created events that get shared
- **Engagement**: Average # of responses per shared event
- **Retention**: % of users who create 2+ events
- **Speed**: Median time from landing to shareable event URL

### Non-Goals (v1.0)
- Calendar integrations (Google Calendar, Apple Calendar)
- In-app messaging or comments
- Advanced scheduling features (recurring events, reminders)
- Payment/ticketing functionality
- Desktop-optimized experience

---

## User Personas

### Persona 1: The Organizer (Sarah)
- **Age**: 26, works in marketing
- **Behavior**: Frequently organizes friend dinners and weekend trips
- **Pain Points**: Group chat chaos, forgotten RSVPs, no-shows
- **Needs**: Quick event creation, clear visibility into responses, ability to lock in time that works for most people

### Persona 2: The Invitee (Marcus)
- **Age**: 29, software engineer
- **Behavior**: Responds to friend invites but doesn't organize often
- **Pain Points**: Losing event details in message threads, forgetting to respond
- **Needs**: Simple yes/no response, clear event details, no app download required

### Persona 3: The Casual Friend (Emma)
- **Age**: 24, grad student
- **Behavior**: Occasionally invited to events through mutual friends
- **Pain Points**: Doesn't want to create accounts for every new app
- **Needs**: Respond with just a name, see event details without barriers

---

## Feature Requirements

## 1. Landing Page

### Requirements
- **FR-1.1**: Display clear value proposition and "Create Event" CTA
- **FR-1.2**: No authentication required to view landing page
- **FR-1.3**: Mobile-responsive design
- **FR-1.4**: Load time < 2 seconds

### User Stories
- As a first-time visitor, I want to understand what friends.io does within 5 seconds
- As a potential organizer, I want to start creating an event with one tap

### Acceptance Criteria
- [ ] "Create Event" button is visible above the fold
- [ ] Page explains both fixed-time and polling options
- [ ] Works on mobile screens (320px - 428px width)

---

## 2. Event Creation Screen

### Requirements
- **FR-2.1**: Collect event title (required, max 100 chars)
- **FR-2.2**: Collect location (required, max 200 chars)
- **FR-2.3**: Allow image upload (optional, max 5MB, formats: jpg, png, gif, webp)
- **FR-2.4**: Collect notes (optional, max 1000 chars, supports line breaks)
- **FR-2.5**: "Time Details" CTA to proceed to next step
- **FR-2.6**: Set cookie on first event creation for user identification
- **FR-2.7**: Form validation with inline error messages
- **FR-2.8**: Auto-save draft to prevent data loss

### User Stories
- As an organizer, I want to add all event details in one place
- As an organizer, I want to include an image to make my event more appealing
- As a user, I don't want to lose my work if I accidentally close the browser

### Acceptance Criteria
- [ ] All required fields show validation errors on submit
- [ ] Image preview displays after upload
- [ ] Form state persists in browser if user navigates away
- [ ] Cookie is set after first successful event creation
- [ ] Character counters show remaining space for title/notes

### Edge Cases
- If image upload fails, show error and allow retry
- If user is offline, show "No connection" message
- If title contains only whitespace, show validation error

---

## 3. Time Details Screen

### Requirements
- **FR-3.1**: Display two time selection options: "Fixed Time" and "Find a Time"
- **FR-3.2**: Fixed Time option shows single date/time picker
- **FR-3.3**: Find a Time option allows adding 2-10 time options
- **FR-3.4**: Date/time picker supports mobile native pickers
- **FR-3.5**: All times stored in UTC, displayed in user's local timezone
- **FR-3.6**: "Finalize Event" CTA to complete creation
- **FR-3.7**: Back button to return to event details (preserves data)

### User Stories
- As an organizer with a confirmed time, I want to set it quickly
- As an organizer without a confirmed time, I want to propose multiple options for voting
- As a user, I want date/time selection to feel native on my device

### Acceptance Criteria
- [ ] Fixed Time picker allows date + time selection
- [ ] Find a Time allows adding/removing time options
- [ ] Minimum 2 time options required for polling
- [ ] Time options can't have duplicates
- [ ] Previous screen data is preserved when returning

### Edge Cases
- If user selects past date/time, show warning (but allow)
- If user tries to finalize poll with < 2 options, show error
- If time options are very close together (< 30 min apart), show warning

---

## 4. Final Event Card Page

### Requirements
- **FR-4.1**: Display complete event summary (title, location, time, image, notes)
- **FR-4.2**: Generate unique shareable URL (format: `friends.io/e/{slug}`)
- **FR-4.3**: "Share Event" button triggers native share sheet
- **FR-4.4**: Share includes event title, time, and URL
- **FR-4.5**: "View My Events" button navigates to dashboard
- **FR-4.6**: Copy URL button with visual confirmation
- **FR-4.7**: Event card is printer-friendly

### User Stories
- As an organizer, I want to share my event immediately after creation
- As an organizer, I want to see exactly what my invitees will see
- As a mobile user, I want to use my phone's native sharing (SMS, WhatsApp, etc.)

### Acceptance Criteria
- [ ] Native share sheet works on iOS and Android
- [ ] Share message includes all key event details
- [ ] URL is short and clean (< 30 chars)
- [ ] Copy button shows "Copied!" feedback for 2 seconds
- [ ] Event card renders identically to invitee view

### Edge Cases
- If native share not supported (desktop), show copy link button prominently
- If URL generation fails, show error and retry button
- If image fails to load, show placeholder

---

## 5. Events Dashboard

### Requirements
- **FR-5.1**: Display two tabs: "Organized Events" and "My Invites"
- **FR-5.2**: Show event cards with status indicators
- **FR-5.3**: Organized Events shows response/vote tracking
- **FR-5.4**: Click event to view detailed tracking page
- **FR-5.5**: Sort events: upcoming first, then by creation date
- **FR-5.6**: Empty states for users with no events
- **FR-5.7**: Pull-to-refresh on mobile

### User Stories
- As an organizer, I want to see all my events in one place
- As an invitee, I want to see events I've responded to
- As a user, I want to quickly check status of upcoming events

### Acceptance Criteria
- [ ] Events load in < 1 second
- [ ] Fixed-time events show RSVP counts (Yes/No/Maybe)
- [ ] Polled events show vote progress bar
- [ ] Past events are visually distinguished (grayed out)
- [ ] Empty state has helpful copy and "Create Event" CTA

### Edge Cases
- If user has 50+ events, implement pagination or infinite scroll
- If event data fails to load, show retry button
- If user clears cookies, explain they'll lose access to dashboard

---

## 6. Fixed Time Event - Tracking View

### Requirements
- **FR-6.1**: Display event details at top
- **FR-6.2**: Show RSVP breakdown: Yes (green), No (red), Maybe (yellow), No response (gray)
- **FR-6.3**: List all invitees with their response and timestamp
- **FR-6.4**: Show total invitee count vs. response count
- **FR-6.5**: "Share Again" button for reminders
- **FR-6.6**: Export guest list option (CSV or simple text)

### User Stories
- As an organizer, I want to see who's confirmed attending
- As an organizer, I want to send reminders to people who haven't responded
- As an organizer, I want to know my headcount for planning

### Acceptance Criteria
- [ ] Response status updates in real-time (or within 5 seconds)
- [ ] Invitees sorted by: Yes → Maybe → No → No Response
- [ ] Visual indicators make status immediately clear
- [ ] Export includes name, response, and response time

### Edge Cases
- If no one has responded yet, show encouraging message
- If all responses are "No", suggest changing time
- If someone accesses event URL but doesn't respond, they don't appear in list

---

## 7. Polled Time Event - Tracking & Locking

### Requirements
- **FR-7.1**: Display event details and all proposed times
- **FR-7.2**: Show vote count per time option with progress bars
- **FR-7.3**: List voters by time option
- **FR-7.4**: Highlight time(s) with most votes
- **FR-7.5**: "Lock In Time" button to select winning time
- **FR-7.6**: Confirmation dialog before locking
- **FR-7.7**: After locking, convert to fixed-time event and generate new share URL

### User Stories
- As an organizer, I want to see which times work for the most people
- As an organizer, I want to finalize the time once enough people have voted
- As an organizer, I want to share the final confirmed time with all invitees

### Acceptance Criteria
- [ ] Vote counts update in real-time (or within 5 seconds)
- [ ] Time options sorted by vote count (highest first)
- [ ] Lock button disabled until at least 3 votes received
- [ ] Locking is permanent (show warning in confirmation)
- [ ] After locking, event appears in dashboard as fixed-time

### Edge Cases
- If two times tie for most votes, organizer can choose either
- If organizer wants to add more time options after creating, not supported in v1 (show message)
- If locked time gets zero "Yes" RSVPs, allow organizer to unlock (v1.1 feature)

---

## 8. Invitee Experience - Fixed Time Event

### Requirements
- **FR-8.1**: View event via shared URL without authentication
- **FR-8.2**: Display complete event details
- **FR-8.3**: Show RSVP buttons: Yes, No, Maybe
- **FR-8.4**: Collect invitee name if not authenticated
- **FR-8.5**: Show confirmation after response
- **FR-8.6**: Allow changing response
- **FR-8.7**: Show who else is attending (optional: organizer can toggle this)

### User Stories
- As an invitee, I want to respond without creating an account
- As an invitee, I want to see event details before responding
- As an invitee, I want to change my RSVP if my plans change

### Acceptance Criteria
- [ ] Event page loads in < 2 seconds
- [ ] RSVP requires name if user not authenticated
- [ ] Response is saved immediately (with visual confirmation)
- [ ] User can change response unlimited times
- [ ] Image, location, and notes are clearly displayed

### Edge Cases
- If event is cancelled, show cancellation message
- If event time is in the past, show "This event has passed" but still allow viewing
- If URL is invalid, show 404 with link to create own event

---

## 9. Invitee Experience - Polled Time Event

### Requirements
- **FR-9.1**: View event via shared URL without authentication
- **FR-9.2**: Display complete event details
- **FR-9.3**: Show all proposed time options
- **FR-9.4**: Allow selecting multiple times that work
- **FR-9.5**: Collect voter name if not authenticated
- **FR-9.6**: Show vote counts after voting (or hide based on organizer preference)
- **FR-9.7**: Allow changing votes
- **FR-9.8**: Show if/when time has been locked

### User Stories
- As an invitee, I want to indicate all times that work for me
- As an invitee, I want to see which times are most popular
- As an invitee, I want to be notified when the organizer finalizes a time

### Acceptance Criteria
- [ ] Time options displayed with checkboxes or toggle buttons
- [ ] Must select at least one time to submit
- [ ] Vote counts shown as bar chart or percentage
- [ ] User can change votes until organizer locks
- [ ] After locking, page updates to show final time + RSVP options

### Edge Cases
- If user votes for all times, show them all options work (funny message)
- If event gets locked while user is voting, show refresh message
- If user tries to vote after locking, redirect to fixed-time RSVP view

---

## Technical Requirements

### Performance
- **TR-1**: Time to Interactive < 3 seconds on 3G
- **TR-2**: Lighthouse Performance Score > 90
- **TR-3**: Image optimization (WebP with fallbacks)
- **TR-4**: Database queries < 100ms for dashboard loads

### Security
- **TR-5**: HTTP-only cookies for authentication
- **TR-6**: CSRF protection on all form submissions
- **TR-7**: Rate limiting on event creation (5 per hour per IP)
- **TR-8**: XSS sanitization on all user inputs
- **TR-9**: Event URLs not guessable (random slug generation)

### Browser Support
- **TR-10**: Chrome/Edge (last 2 versions)
- **TR-11**: Safari iOS (last 2 versions)
- **TR-12**: Samsung Internet (last 2 versions)
- **TR-13**: Firefox (last 2 versions)

### Accessibility
- **TR-14**: WCAG 2.1 Level AA compliance
- **TR-15**: Keyboard navigation support
- **TR-16**: Screen reader compatibility
- **TR-17**: Minimum color contrast ratio 4.5:1
- **TR-18**: Touch targets minimum 44x44px

### Data & Privacy
- **TR-19**: Cookie consent banner (GDPR compliance)
- **TR-20**: No sale of user data
- **TR-21**: Data retention: events auto-delete 90 days after date
- **TR-22**: User can request data deletion

---

## Design Requirements

### Visual Design
- **DR-1**: Mobile-first design (320px - 428px)
- **DR-2**: Tablet support (768px - 1024px)
- **DR-3**: Desktop functional but not primary focus
- **DR-4**: Consistent color scheme (primary, secondary, success, error, warning)
- **DR-5**: Readable typography (minimum 16px body text on mobile)

### UX Principles
- **DR-6**: Maximum 3 taps to complete any primary action
- **DR-7**: Clear CTAs above the fold on every screen
- **DR-8**: Inline validation with helpful error messages
- **DR-9**: Loading states for all async operations
- **DR-10**: Confirmation for destructive actions (delete, cancel event)

### Microcopy
- **DR-11**: Friendly, casual tone (not corporate)
- **DR-12**: Clear labels (avoid jargon)
- **DR-13**: Actionable error messages
- **DR-14**: Encouraging empty states

---

## Open Questions & Future Considerations

### V1 Open Questions
1. Should organizers be able to close voting manually before locking a time?
2. Should we show vote counts to invitees during polling, or only after locking?
3. Should we allow anonymous users to create events, or require cookie first?
4. What happens to events after they pass? Auto-archive after X days?

### Future Features (Post-V1)
- **V1.1**: Calendar sync (add to Google/Apple Calendar)
- **V1.2**: Event templates (save frequent event types)
- **V1.3**: In-app notifications when friends respond
- **V1.4**: Comments/chat per event
- **V1.5**: Recurring events
- **V1.6**: Public events (shareable on social media)
- **V1.7**: Integration with group chat apps (Slack, Discord, WhatsApp)
- **V1.8**: Analytics dashboard for power users

---

## Launch Criteria

### MVP Must-Haves
- ✅ All 9 core features implemented
- ✅ Mobile experience polished (iOS + Android)
- ✅ Cookie-based auth working
- ✅ Share functionality working on all platforms
- ✅ No critical bugs
- ✅ Performance metrics met

### Nice-to-Haves (Can Ship Without)
- Desktop optimization
- Calendar export (.ics files)
- Email notifications
- Event reminders

### Pre-Launch Checklist
- [ ] Beta testing with 20+ users
- [ ] Load testing (100 concurrent users)
- [ ] Security audit
- [ ] Analytics tracking implemented
- [ ] Error monitoring (Sentry or similar)
- [ ] Privacy policy published
- [ ] Terms of service published

---

## Appendix

### Glossary
- **Fixed Time Event**: Event with single confirmed date/time
- **Polled Time Event**: Event with multiple proposed times for voting
- **Locked Event**: Polled event where organizer has selected final time
- **RSVP**: Response to fixed-time event (Yes/No/Maybe)
- **Vote**: Selection of available times on polled event
- **Organizer**: User who creates event
- **Invitee**: User who receives event link

### References
- User Flow: See `USER_FLOW.md`
- Database Schema: See `SCHEMA_ERD.md`
- Design Mockups: [Link to Figma/design tool]
- Competitive Analysis: Doodle, When2Meet, Facebook Events

---

**Document Approval**
- Product Manager: _______________
- Engineering Lead: _______________
- Design Lead: _______________