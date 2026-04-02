# NET OS Platform TODO

## Phase 1: Database & Backend (DONE)
- [x] Database schema with 17 tables
- [x] Seed data for 7 locations, 917 resources, bundles, multipliers
- [x] tRPC routers for all features (50+ endpoints)
- [x] Database query helpers

## Phase 2: Core Pages (DONE)
- [x] Landing page with hero, locations, features, pricing, zones
- [x] Dashboard with stats overview, location performance, charts
- [x] Locations grid page with search and occupancy
- [x] Location detail with resources, filters, pagination
- [x] Bookings page with status management
- [x] Wallet page with dual wallet, ledger, spending analytics
- [x] Bundles pricing page with comparison and FAQ
- [x] Companies page with tier badges and search
- [x] Visitors page with stats and check-in/out
- [x] Signing platform page with branding editor and live preview
- [x] Devices & IoT page with sensor data
- [x] Notifications page with mark-all-read
- [x] Invites page with invite creation
- [x] Settings page with profile, notifications, access, integrations tabs

## Phase 3: Benchmark Gap Fixes (DONE)
- [x] Complete booking flow with time slot picker and availability grid
- [x] Resource search/filter (capacity, type, zone, amenities)
- [x] Resource pagination (12 per page)
- [x] Member profile page with settings tabs
- [x] Settings/preferences page (account, notifications, security)
- [x] Credit transaction flow - booking deducts credits with ledger entry
- [x] Dashboard with real charts from DB data (Recharts)
- [x] Company detail page with members and usage stats
- [x] Visitor invite flow with deep link generation
- [x] Visitor access token generation
- [x] Invite system with token and link generation
- [x] Access log with zone tracking
- [x] Mobile responsive optimization across all pages
- [x] Empty states with helpful CTAs
- [x] Dynamic pricing multipliers per day (0.45x-1.4x)
- [x] Wallet top-up with ledger recording
- [x] Booking cancellation with credit refund
- [x] Notification mark-all-read batch operation

## Phase 4: Testing (DONE)
- [x] 41 unit tests passing (auth, locations, resources, bundles, multipliers, companies, dashboard, devices, wallets, bookings, visitors, invites, notifications, access, profile)
- [x] Edge case testing (unauthenticated access, role-based access)
- [x] Credit flow testing (topup, booking deduction, cancellation refund)
- [x] Checkpoint and delivery

## Future Enhancements (Not Yet Implemented)
- [ ] Stripe payment integration (needs API keys)
- [ ] Salto KS door access integration (needs API credentials)
- [ ] React Native mobile app (Expo)
- [ ] Calendar view for bookings (week/month view)
- [ ] Floor plan / visual resource map per location
- [ ] QR code check-in for desks/rooms
- [ ] User onboarding flow (Uber-style progressive signup)
- [ ] Community/events section
- [ ] Member directory with searchable profiles
- [ ] Micro-services page (coffee, lunch, printing, lockers)
- [ ] WebSocket real-time updates for signing screens
- [ ] MQTT integration for IoT sensors
- [ ] Predictive analytics for multiplier optimization
- [ ] SMS/WhatsApp deep links for visitor invites
- [ ] Auth0 SSO integration

## Phase 5: Huisstijl Update (from mrgreen-members-v2.html)
- [x] Switch font from Inter to Montserrat (200-700)
- [x] Apply exact color palette: #627653, #3a4a34, #f6f5f2, #111, #b8a472
- [x] Upload all Mr. Green photos to CDN and use in platform
- [x] Rewrite landing page to match editorial luxury style
- [x] Apply minimal typography (font-weight 200, tight letter-spacing)
- [x] Add ticker animation, fade-in scroll effects
- [x] Update DashboardLayout with Mr. Green branding
- [x] Apply form styling (border-bottom inputs, transparent bg)
- [x] Update all pages with consistent huisstijl

## Phase 6: CRM & Marketing Outreach Module (DONE)
- [x] Research AgentGTM and define CRM features
- [x] Database schema for leads, campaigns, sequences, pipeline (6 CRM tables)
- [x] CRM Pipeline page with Kanban board and drag-drop stage transitions
- [x] Lead detail page with activity timeline, AI scoring, AI enrichment, AI suggestions
- [x] Campaign management with email sequences and enrollment tracking
- [x] Email template library with AI generation
- [x] Pipeline analytics and stats (total leads, pipeline value, conversion rate)
- [x] CRM tests (60 total tests passing)
