# Event Scheduler

A frictionless, mobile-first event scheduling application for coordinating group plans through voting. Built as "Calendly without the corporate nature" - perfect for social gatherings, friend meetups, and casual group coordination.

## ✨ Features

- **Zero Authentication for Voters** - Participants vote without creating accounts
- **Optional Phone Auth for Organizers** - Persistent dashboard and multi-device access
- **Real-time Updates** - Live vote counts using Supabase real-time subscriptions
- **Smart Recommendations** - Automatic best time suggestions based on availability
- **SMS Notifications** - Optional text alerts when plans are finalized
- **Mobile-First Design** - Beautiful, responsive UI optimized for mobile devices
- **Dark Mode** - Automatic theme switching with manual override
- **Location Search** - Powered by Mapbox for real venue and business names
- **Hero Images** - Optional event images with drag & drop upload

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Supabase account
- Twilio account (for SMS features)
- Mapbox account (for location search)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/event-scheduler.git
cd event-scheduler

# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local

# Add your credentials to .env.local
# See docs/setup/ for detailed setup guides
```

### Environment Variables

Create `.env.local` with:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Twilio (for SMS)
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+1234567890

# Mapbox
NEXT_PUBLIC_MAPBOX_TOKEN=pk.your-token-here
```

### Database Setup

1. Go to your Supabase project dashboard
2. Open SQL Editor
3. Run the schema from `docs/SCHEMA.md`
4. Run migrations from `migrations/` folder in order:
   - `01_add_performance_indexes.sql`
   - `02_add_vote_aggregation_function.sql`
   - `03_add_rls_policies.sql`

### Running Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📚 Documentation

### Setup Guides
- [Authentication Setup](docs/setup/AUTHENTICATION.md) - Phone auth for organizers
- [SMS Notifications](docs/setup/SMS_NOTIFICATIONS.md) - Text notification setup
- [Additional Features](docs/setup/FEATURES.md) - Hero images, Mapbox, and more

### Reference
- [Performance Guide](docs/PERFORMANCE.md) - Optimization and monitoring
- [Changelog](docs/CHANGELOG.md) - Version history and updates
- [Product Requirements](docs/PRD.md) - Complete product specifications
- [Database Schema](docs/SCHEMA.md) - Entity relationship diagram
- [Style Guide](docs/STYLEGUIDE.md) - Design system and conventions
- [User Journey](docs/USER_JOURNEY.md) - Flow diagrams and UX patterns
- [Testing Guide](docs/TESTING_GUIDE.md) - Testing procedures

### AI Development
- [CLAUDE.md](CLAUDE.md) - Guide for AI assistants working on this codebase

## 🏗️ Tech Stack

**Frontend**
- [Next.js 15](https://nextjs.org/) - React framework with App Router
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Tailwind CSS 4](https://tailwindcss.com/) - Styling
- [React](https://react.dev/) - UI library

**Backend**
- [Supabase](https://supabase.com/) - PostgreSQL database + real-time + auth
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers) - Serverless functions
- [Twilio](https://www.twilio.com/) - SMS delivery
- [Mapbox](https://www.mapbox.com/) - Location search

**Deployment**
- [Vercel](https://vercel.com/) - Hosting and CDN
- [GitHub Actions](https://github.com/features/actions) - CI/CD

## 📖 Usage

### Creating an Event

1. Visit the homepage
2. Click "Create an Event"
3. Choose time slots (presets or custom)
4. Add event details (title, location, notes)
5. Optionally upload a hero image
6. Share the generated link with participants

### Voting on Times

1. Open the event link shared by organizer
2. Select your availability for each time slot:
   - ✓ Can make it
   - ? Maybe
   - ✗ Can't make it
3. Optionally add your name
4. Optionally verify phone for notifications
5. Submit your votes

### Managing Events (Organizers)

1. Sign up / Login with phone number
2. View all your events in the dashboard
3. Click an event to see vote breakdown
4. Lock in the best time when ready
5. Participants receive SMS notification (if verified)

## 🎯 Architecture

### Key Patterns

**Cookie-Based Anonymous Users**
- UUID stored in browser cookie (`event_scheduler_user`)
- Persists for 365 days
- No account required for voting

**Dual Authentication System**
- Anonymous voting (cookie-based)
- Optional organizer accounts (phone auth)
- Both systems coexist seamlessly

**Performance Optimizations**
- PostgreSQL server-side aggregation
- Composite database indexes
- Batch operations (upsert votes)
- Debounced real-time updates (1s delay)
- 84% faster queries than initial implementation

### Database Tables

- `events` - Core event entity
- `time_slots` - Proposed meeting times  
- `user_cookies` - Anonymous participants
- `votes` - Availability responses
- `event_notifications` - SMS opt-ins

See [SCHEMA.md](docs/SCHEMA.md) for complete ERD.

## 🧪 Testing

```bash
# Run linter
npm run lint

# Build for production
npm run build

# Start production server
npm start
```

For comprehensive testing procedures, see [TESTING_GUIDE.md](docs/TESTING_GUIDE.md).

## 📊 Performance

- Vote breakdown: **< 500ms** (50 participants)
- Vote submission: **< 300ms** (10 votes)
- Dashboard load: **< 1.5s** (first paint)
- Database queries: **82% reduction** vs initial implementation

See [PERFORMANCE.md](docs/PERFORMANCE.md) for detailed benchmarks and optimization guide.

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

[Add your license here]

## 👤 Author

Connor Sweeney

## 🙏 Acknowledgments

- UI components inspired by shadcn/ui
- Icons from Solar Icons (iconify.design)
- Built with AI assistance from Claude (Anthropic)
- Deployed on Vercel

## 📞 Support

For issues and questions:
- Check the [documentation](docs/)
- Review [common issues](docs/TESTING_GUIDE.md#troubleshooting)
- Open an issue on GitHub

## 🗺️ Roadmap

See [CHANGELOG.md](docs/CHANGELOG.md#future-roadmap) for planned features:
- Email notifications
- Calendar export (.ics files)
- Multiple date polling
- Recurring events
- Event templates
- Collaborative organizers
- Advanced analytics

---

**Built with ❤️ for making group coordination effortless**
