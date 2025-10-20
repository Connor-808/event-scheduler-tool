# Documentation Index

Quick reference guide to all documentation in the Event Scheduler project.

## 📁 Structure

```
event-scheduler/
├── README.md                          # Project overview and quick start
├── CLAUDE.md                          # AI development guide
├── docs/
│   ├── CHANGELOG.md                   # Version history and updates
│   ├── PERFORMANCE.md                 # Performance optimization guide
│   ├── PRD.md                         # Product requirements document
│   ├── SCHEMA.md                      # Database schema and ERD
│   ├── STYLEGUIDE.md                  # Design system and conventions
│   ├── TESTING_GUIDE.md               # Testing procedures
│   ├── USER_JOURNEY.md                # User flow diagrams
│   └── setup/
│       ├── AUTHENTICATION.md          # Phone auth setup
│       ├── FEATURES.md                # Additional features setup
│       └── SMS_NOTIFICATIONS.md       # SMS notification setup
└── migrations/                        # Database migration scripts
    ├── 01_add_performance_indexes.sql
    ├── 02_add_vote_aggregation_function.sql
    └── 03_add_rls_policies.sql
```

## 🚀 Getting Started

**New to the project?**
1. Start with [README.md](../README.md) - Project overview and quick start
2. Review [PRD.md](PRD.md) - Understand product goals and features
3. Check [SCHEMA.md](SCHEMA.md) - Database structure
4. Follow setup guides in `docs/setup/`

**Setting up features?**
- [setup/AUTHENTICATION.md](setup/AUTHENTICATION.md) - Phone auth for organizers
- [setup/SMS_NOTIFICATIONS.md](setup/SMS_NOTIFICATIONS.md) - Text notifications
- [setup/FEATURES.md](setup/FEATURES.md) - Hero images, Mapbox, dark mode

**Optimizing performance?**
- [PERFORMANCE.md](PERFORMANCE.md) - Complete optimization guide

**Working on design?**
- [STYLEGUIDE.md](STYLEGUIDE.md) - Colors, typography, spacing, components

**Testing?**
- [TESTING_GUIDE.md](TESTING_GUIDE.md) - Testing procedures and checklist

## 📚 Documentation by Topic

### Setup & Configuration

| Document | Purpose | When to Use |
|----------|---------|-------------|
| [README.md](../README.md) | Project overview and quick start | First time setup |
| [setup/AUTHENTICATION.md](setup/AUTHENTICATION.md) | Phone auth configuration | Setting up organizer login |
| [setup/SMS_NOTIFICATIONS.md](setup/SMS_NOTIFICATIONS.md) | SMS notification setup | Adding text alerts |
| [setup/FEATURES.md](setup/FEATURES.md) | Additional features | Hero images, Mapbox, etc. |

### Development

| Document | Purpose | When to Use |
|----------|---------|-------------|
| [CLAUDE.md](../CLAUDE.md) | AI development guide | Working with AI assistants |
| [SCHEMA.md](SCHEMA.md) | Database schema | Understanding data model |
| [STYLEGUIDE.md](STYLEGUIDE.md) | Design system | Building UI components |
| [USER_JOURNEY.md](USER_JOURNEY.md) | User flows | Understanding UX |
| [PRD.md](PRD.md) | Product requirements | Feature specifications |

### Operations

| Document | Purpose | When to Use |
|----------|---------|-------------|
| [PERFORMANCE.md](PERFORMANCE.md) | Performance optimization | Improving speed |
| [TESTING_GUIDE.md](TESTING_GUIDE.md) | Testing procedures | QA and validation |
| [CHANGELOG.md](CHANGELOG.md) | Version history | Tracking changes |

## 🔍 Quick Reference

### Common Tasks

**Setting up the database:**
```bash
# 1. Run main schema from SCHEMA.md
# 2. Run migrations in order:
migrations/01_add_performance_indexes.sql
migrations/02_add_vote_aggregation_function.sql
migrations/03_add_rls_policies.sql
```

**Configuring authentication:**
- See [setup/AUTHENTICATION.md](setup/AUTHENTICATION.md)
- Enable Supabase Phone Auth
- Add Twilio credentials

**Adding SMS notifications:**
- See [setup/SMS_NOTIFICATIONS.md](setup/SMS_NOTIFICATIONS.md)
- Create event_notifications table
- Configure Twilio

**Optimizing performance:**
- See [PERFORMANCE.md](PERFORMANCE.md)
- Run performance migrations
- Monitor query times

**Testing the app:**
- See [TESTING_GUIDE.md](TESTING_GUIDE.md)
- Test organizer flow
- Test voter flow
- Check performance

## 📖 Learning Path

### For New Developers

1. **Day 1: Understanding**
   - Read [README.md](../README.md)
   - Review [PRD.md](PRD.md)
   - Study [SCHEMA.md](SCHEMA.md)

2. **Day 2: Setup**
   - Follow [README.md](../README.md) quick start
   - Run database migrations
   - Test local environment

3. **Day 3: Features**
   - Set up authentication ([setup/AUTHENTICATION.md](setup/AUTHENTICATION.md))
   - Configure SMS ([setup/SMS_NOTIFICATIONS.md](setup/SMS_NOTIFICATIONS.md))
   - Add optional features ([setup/FEATURES.md](setup/FEATURES.md))

4. **Day 4: Development**
   - Study [STYLEGUIDE.md](STYLEGUIDE.md)
   - Review [USER_JOURNEY.md](USER_JOURNEY.md)
   - Read [CLAUDE.md](../CLAUDE.md) if using AI

5. **Day 5: Testing & Deployment**
   - Follow [TESTING_GUIDE.md](TESTING_GUIDE.md)
   - Review [PERFORMANCE.md](PERFORMANCE.md)
   - Deploy to production

### For Designers

- [STYLEGUIDE.md](STYLEGUIDE.md) - Complete design system
- [USER_JOURNEY.md](USER_JOURNEY.md) - User flows and UX
- [PRD.md](PRD.md) - Product requirements and vision

### For Database Administrators

- [SCHEMA.md](SCHEMA.md) - Complete database schema
- [PERFORMANCE.md](PERFORMANCE.md) - Query optimization
- `migrations/` - All database migrations

### For DevOps

- [README.md](../README.md) - Deployment instructions
- [PERFORMANCE.md](PERFORMANCE.md) - Performance monitoring
- [CHANGELOG.md](CHANGELOG.md) - Version tracking

## 🔧 Maintenance

### Updating Documentation

**When adding new features:**
1. Update [CHANGELOG.md](CHANGELOG.md)
2. Add setup guide to `docs/setup/` if needed
3. Update [README.md](../README.md) features list
4. Update [PRD.md](PRD.md) if scope changes

**When making performance changes:**
1. Update [PERFORMANCE.md](PERFORMANCE.md)
2. Add new migrations to `migrations/`
3. Document in [CHANGELOG.md](CHANGELOG.md)

**When changing design:**
1. Update [STYLEGUIDE.md](STYLEGUIDE.md)
2. Document component changes
3. Update [USER_JOURNEY.md](USER_JOURNEY.md) if flows change

### Documentation Standards

- Use clear, concise language
- Include code examples
- Add troubleshooting sections
- Keep table of contents updated
- Link between related documents
- Use consistent formatting (Markdown)

## 📞 Need Help?

Can't find what you're looking for?

1. **Search the docs:** Use your editor's search (Cmd/Ctrl+F)
2. **Check CLAUDE.md:** AI assistant guidance
3. **Review CHANGELOG.md:** Recent changes and updates
4. **Open an issue:** GitHub issues for bugs/questions

## 📝 Document Changelog

**October 20, 2025** - Documentation consolidation
- Consolidated 21 root-level docs into organized structure
- Created `docs/` directory with clear hierarchy
- Merged redundant setup guides
- Improved README with actual project info
- Added this index document

---

**Last Updated**: October 20, 2025  
**Structure Version**: 2.0


