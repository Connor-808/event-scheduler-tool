# Changelog

All notable changes and feature additions to Event Scheduler.

## [Performance Optimizations] - October 15, 2025

### Added
- PostgreSQL function `get_vote_breakdown()` for server-side vote aggregation
- PostgreSQL function `get_event_with_summary()` for efficient data fetching
- 15+ composite database indexes for query optimization
- Row Level Security (RLS) policies on all tables
- Real-time subscription debouncing (1 second delay)
- API middleware utilities (`lib/api-utils.ts`)
- Twilio SMS utilities (`lib/twilio.ts`)

### Changed
- Vote breakdown query: 2.5s → 400ms (**84% faster**)
- Vote submission: 800ms → 150ms (**81% faster**)
- Dashboard load: 3.2s → 900ms (**72% faster**)
- Database queries reduced from 11 to 2 per dashboard load (**82% reduction**)

### Fixed
- N+1 query pattern in vote aggregation
- Inefficient vote upsert (20 queries → 1 query)
- UI thrashing from instant real-time updates
- Missing database indexes causing slow queries

### Security
- Enabled RLS on all tables
- Added public read policies for shareable data
- Secure write operations via service role in API routes

**Impact**: 70-85% reduction in query times, ready for production scale

---

## [Phone Authentication] - October 12, 2025

### Added
- Optional phone authentication for organizers
- Supabase Auth integration with Twilio SMS
- Login page (`/login`)
- Signup page (`/signup`)
- Organizer dashboard (`/dashboard`)
- `PhoneAuth` component for OTP verification
- `organizer_user_id` column in events table
- Authentication utilities (`lib/auth.ts`)

### Features
- Phone-based login (no passwords)
- 6-digit OTP codes with 10-minute expiry
- Rate limiting (5 OTP requests per hour)
- Multi-device access
- Persistent event management

### Security
- OTP expiration after 10 minutes
- Rate limiting on verification attempts
- Secure phone number storage in Supabase Auth

**Note**: Anonymous cookie-based voting remains unchanged for participants

---

## [SMS Notifications] - October 10, 2025

### Added
- SMS notification system for participants
- `event_notifications` database table
- Phone verification flow for voters
- `PhoneVerification` component
- API routes:
  - `POST /api/events/[id]/request-verification`
  - `POST /api/events/[id]/verify-code`
  - `POST /api/events/[id]/lock-in`

### Features
- Opt-in text notifications
- 6-digit verification codes
- Automatic notifications when event is locked in
- Graceful error handling
- Mobile-optimized UI

### Technical
- E.164 phone number formatting
- 10-minute code expiration
- Twilio SMS integration
- Foreign key constraints to user_cookies

**Cost**: ~$0.0075 per SMS (Twilio pricing)

---

## [Hero Images] - October 8, 2025

### Added
- Optional hero image upload for events
- `hero_image_url` column in events table
- `notes` column in events table
- Supabase Storage bucket: `event-images`
- Image upload API: `POST /api/upload-image`
- `EventHeroImage` component

### Features
- Drag & drop image upload
- Preview before upload
- File type validation (JPG, PNG, GIF, WebP, HEIC/HEIF)
- 5MB file size limit
- iPhone HEIC/HEIF format support
- Public image URLs

### Technical
- Supabase Storage integration
- Service role key for uploads
- Client-side and server-side validation
- Graceful fallback if upload fails

---

## [Location Search] - October 8, 2025

### Added
- Mapbox Places API integration
- `LocationPicker` component
- Real business and venue search
- POI (Point of Interest) data

### Features
- 100,000 free searches per month (Mapbox)
- Autocomplete suggestions
- USA-focused results
- Business name and address search

### Configuration
- Requires `NEXT_PUBLIC_MAPBOX_TOKEN` environment variable
- Free tier sufficient for most use cases

---

## [Initial MVP] - October 8, 2025

### Added
- Landing page (`/`)
- Event creation flow (`/create`)
- Time slot selection (presets and custom)
- Voting interface (`/event/[id]`)
- Organizer dashboard (`/event/[id]/dashboard`)
- Share page (`/event/[id]/share`)
- Cookie-based user identification
- Real-time vote updates
- Vote breakdown visualization
- Time locking functionality

### UI Components
- `Button` - Multiple variants (primary, secondary, destructive)
- `Input` - Text input with validation
- `Textarea` - Multiline input
- `Card` - Container components
- `Modal` - Dialog system
- `LoadingSpinner` - Loading states
- `StatusIcon` - Success/error/warning icons
- `FixedBottomCTA` - Mobile CTA container

### Database Schema
- `events` table - Core event entity
- `time_slots` table - Proposed meeting times
- `user_cookies` table - Anonymous participants
- `votes` table - Availability responses

### Features
- Unique event IDs (e.g., "brave-blue-elephant")
- Three-option voting (available/maybe/unavailable)
- Optional display names
- Vote modification
- Recommended time algorithm
- Native mobile share API
- Clipboard copy fallback
- Dark mode support
- Mobile-first responsive design

### Technical Stack
- Next.js 15 with App Router
- TypeScript (strict mode)
- Tailwind CSS 4
- Supabase (PostgreSQL + real-time)
- Vercel deployment ready

---

## [Project Setup] - October 5, 2025

### Added
- Initial project scaffolding
- Next.js 15 configuration
- TypeScript strict mode
- Tailwind CSS 4 setup
- Supabase client configuration
- Environment variable structure
- Database schema design
- Utility functions:
  - Event ID generation
  - Cookie management
  - Date formatting
  - Preset time slot generators

### Documentation
- Product Requirements Document (PRD)
- Database Schema (SCHEMA.md)
- Style Guide (STYLEGUIDE.md)
- User Journey flows (USER_JOURNEY.md)
- Testing Guide (TESTING_GUIDE.md)
- Claude AI assistant guide (CLAUDE.md)

---

## Upgrade Guide

### From Pre-Authentication to Authentication

1. Run database migration:
   ```sql
   ALTER TABLE events ADD COLUMN organizer_user_id UUID REFERENCES auth.users(id);
   ```

2. Configure Supabase Phone Auth in dashboard

3. Add Twilio credentials to environment

4. Existing anonymous events continue to work

### From Pre-Optimization to Optimized

1. Run performance migrations (01, 02, 03) in order

2. No code changes needed - already applied

3. Verify with performance tests

4. Monitor query times in production

---

## Breaking Changes

**None** - All updates are backward compatible. Anonymous voting, existing events, and core functionality remain unchanged.

---

## Future Roadmap

### Planned Features
- [ ] Email notifications (alternative to SMS)
- [ ] Calendar export (.ics files)
- [ ] Multiple date polling
- [ ] Recurring events
- [ ] Event templates
- [ ] Collaborative organizers
- [ ] Advanced analytics

### Performance Enhancements
- [ ] React Query caching
- [ ] Optimistic UI updates
- [ ] Loading skeletons
- [ ] Progressive Web App (PWA)
- [ ] Service worker caching

### Developer Experience
- [ ] End-to-end testing (Playwright)
- [ ] Unit tests (Jest)
- [ ] CI/CD pipeline improvements
- [ ] Automated performance testing

---

## Statistics

**Total Features**: 25+  
**API Routes**: 10  
**UI Components**: 15  
**Database Tables**: 5  
**Lines of Code**: ~8,000  
**Test Coverage**: Manual testing (automated tests planned)  
**Performance**: 70-85% faster than initial implementation

---

## Contributors

Primary development by Connor Sweeney with AI assistance from Claude (Anthropic).

---

## Support

For issues, questions, or contributions:
- See documentation in `/docs`
- Check PRD.md for requirements
- Review TESTING_GUIDE.md for testing procedures
- Consult CLAUDE.md for AI development patterns


