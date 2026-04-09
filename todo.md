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

## Phase 7: Advanced Resource Management (Nexudus-inspired) (DONE)
- [x] Research Nexudus resource settings, rules, pricing, availability
- [x] Resource CRUD admin (create, edit, delete resources)
- [x] Resource pricing rules (peak/off-peak, per-hour/day/month, member tier discounts)
- [x] Booking rules engine (min/max duration, advance booking limit, cancellation policy, buffer time)
- [x] Availability schedules (operating hours per resource, blocked dates, maintenance windows)
- [x] Amenities management (assign amenities to resources, filterable)
- [x] Resource groups/categories with bulk settings
- [x] Capacity and layout management
- [x] Resource images and descriptions
- [x] Admin resource detail page with all settings tabs
- [x] Tests for resource management

## Phase 8: Signing App Upgrade - Kiosk Display & Auto Scraper
- [x] Backend scraper API: extract logo, brand colors, and photos from company website URL
- [x] Store scraped branding data (logo URL, colors, photos) in company record
- [x] 34-inch kiosk display page (/kiosk/display?company=<id>) with company branding
- [x] Kiosk display: full-screen logo, brand colors, employee photos, welcome message
- [x] Kiosk display: auto-rotate between company photos/content
- [x] Unique kiosk URL per company for kiosk mode paste-in
- [ ] Upgrade Signing admin page with "Auto-scrape from website" button
- [ ] Live preview of scraped branding before saving
- [x] Tests for scraper and kiosk display (23 kiosk tests passing)

## Phase 9: Butler Kiosk App (POS System)
- [x] Research Nexudus catering/POS/products in resources
- [x] Database: products, product categories, kiosk orders, order items, booking add-ons
- [x] Backend: product CRUD, kiosk order flow, payment (credits/Stripe/invoice)
- [x] Backend: booking add-ons (link products to meeting room bookings)
- [x] Butler Kiosk POS page (/butler) - tablet/screen optimized
- [x] Kiosk: product grid with categories, cart, payment method selector
- [x] Kiosk: pay with personal credits, company credits, Stripe/PIN, or on company tab
- [ ] Kiosk: QR code scan to identify user
- [x] Admin: product management page (CRUD, categories, pricing)
- [x] Admin: order history and revenue dashboard
- [ ] Booking add-ons: select products when booking a meeting room
- [x] Tests for kiosk and product management (92 total tests passing)

## Phase 10: Butler Kiosk Product Update (DONE)
- [x] Review current kiosk products in database
- [x] Replace products with realistic Dutch cafe items (45 products, 8 categories)
- [x] Add product photos via CDN for all food & drink items (23 images uploaded)
- [x] Add VAT rates (9% food/drink, 21% services/equipment)
- [x] Verify kiosk display with new products and images

## Phase 11: Smart Parking Module (DONE)
- [x] Research smart parking solutions (ParkBee, Sensorberg, etc.)
- [x] Database: parking zones, spots, reservations, sessions, pricing rules, permits
- [x] Backend: parking CRUD, reservation flow, session tracking, pricing engine
- [x] Admin: parking zone settings, spot management, pricing rules, permit management
- [x] Member: reserve parking spot, view availability, active session
- [x] Unregistered: paid parking flow (license plate entry, payment)
- [x] Registered member bonuses (day-before booking discount, guaranteed spot)
- [x] Smart unused space optimization (auto-release, waitlist)
- [x] Parking dashboard with occupancy, revenue, utilization analytics
- [x] Tests for parking module

## Phase 12: Operations Dashboard (Zendesk-style) (DONE)
- [x] Research Zendesk ticket system architecture
- [x] Database: tickets, ticket messages, ticket tags, SLA rules, canned responses
- [x] Backend: ticket CRUD, assignment, escalation, AI auto-response
- [x] AI-first ticket handling (auto-categorize, suggest response, auto-resolve)
- [x] Operations agenda view (daily/weekly schedule, events, maintenance)
- [x] Who-is-in presence board (live member check-in status)
- [x] Critical messages/alerts panel
- [x] Ticket dashboard with SLA metrics, response times, satisfaction
- [x] Member-facing ticket submission (help/support page)
- [x] Tests for operations module

## Phase 13: Room Control & Sensor Monitoring (DONE)
- [x] Database: room zones, control points, sensor readings, automation rules
- [x] Backend: room control CRUD, sensor data ingestion, automation engine
- [x] Room control page: HVAC, lighting, AV per room/zone
- [x] Sensor monitoring: temperature, humidity, CO2, occupancy, noise, PM2.5, VOC
- [x] Real-time sensor dashboard with zone overview and status indicators
- [x] Automation rules (auto-adjust based on occupancy/schedule)
- [x] Alert thresholds and notifications
- [x] Tests for room control module

## Phase 14: Supabase Integration (DONE)
- [x] Supabase REST API bridge (insert, upsert, select)
- [x] Realtime broadcasting for parking, tickets, presence
- [x] User sync to Supabase mirror tables
- [x] Migration SQL generator with RLS policies
- [x] Tests for Supabase integration
- [ ] Connect Supabase project credentials (needs SUPABASE_URL, SUPABASE_SERVICE_KEY)

## Phase 15: Mobile App Architecture (React Native/Expo) (DONE)
- [x] Research Salto KS Connect API for mobile access
- [x] Research UniFi Identity for WiFi provisioning
- [x] Mobile app architecture document (tech stack, screens, API connection)
- [x] Salto KS integration module (user management, mobile keys, door access, audit trail)
- [x] UniFi Identity integration module (WiFi provisioning, device management, profiles)
- [x] 16 new database tables migrated
- [x] 145 total tests passing (53 new phase 11-15 tests)
- [ ] Build Expo mobile app shell (separate project)
- [ ] Connect Salto KS API credentials
- [ ] Connect UniFi controller credentials

## Phase 16: Mobile Responsiveness Fixes (DONE)
- [x] Fix DashboardLayout mobile sidebar (hamburger menu, sheet overlay, proper close)
- [x] Fix DashboardLayoutSkeleton for mobile (no fixed sidebar on small screens)
- [x] Fix Dashboard page mobile layout (KPIs, wallets, charts, booking rows)
- [x] Fix Home landing page mobile padding and spacing
- [x] Fix Bookings page mobile header, tabs, and booking rows
- [x] Fix WalletPage mobile header, cards, and analytics strip
- [x] Fix OperationsDashboard mobile header, stats grid, and tabs
- [x] Fix ParkingAdmin mobile header, stats grid, and tabs
- [x] Fix RoomControl mobile header and tabs
- [x] Fix ButlerKiosk mobile layout (stacked layout, responsive cart)
- [x] Add overflow-x:hidden to html/body for mobile
- [x] 145 tests passing, 0 TS errors

## Phase 17: Room Control Demo Data (DONE)
- [x] Seed 13 zones across 2 locations (Amsterdam + Rotterdam)
- [x] Seed 84 control points (HVAC, lighting, AV, blinds)
- [x] Seed 1872 sensor readings (temperature, humidity, CO2, noise, light, occupancy)
- [x] Seed 8 automation rules (schedule-based, occupancy-based, booking-triggered)
- [x] Seed 7 alert thresholds

## Phase 18: CRM Visual Marketing Flow + Demo Leads (DONE)
- [x] Visual marketing flow page (/crm/flow) with 5-step pipeline
- [x] Scrape → Doelgroepanalyse → Outreach → Engagement → Conversie
- [x] 17 demo leads (Adyen, Booking.com, Mollie, Picnic, Bunq, etc.)
- [x] 121 lead activities (journey trail per lead)
- [x] 4 campaigns with email sequences and metrics
- [x] 5 email templates (incl. AI-generated)
- [x] Trigger events panel (funding, huurcontract, team groei, etc.)

## Phase 19: Member User App (PWA Web App) (DONE)
- [x] AppShell component with bottom navigation (Home, Boekingen, Wallet, Toegang, Profiel)
- [x] App Home (/app) - personalized dashboard with greeting, quick access, upcoming bookings
- [x] App Bookings (/app/bookings) - upcoming and past bookings
- [x] App Wallet (/app/wallet) - balance cards, transaction history
- [x] App Access (/app/access) - digital key (Salto KS), door controls, WiFi (UniFi)
- [x] App Parking (/app/parking) - zones, reservations, active session
- [x] App Support (/app/support) - ticket creation, FAQ, ticket history
- [x] App Profile (/app/profile) - user info, settings menu, logout
- [x] App route structure (/app/*) with 7 pages
- [x] 145 tests passing, 0 TS errors

## Phase 20: Member App UX Improvements (DONE)
- [x] AppShell: safe area insets for notch/dynamic island
- [x] AppShell: active tab indicator dot + larger touch targets
- [x] AppShell: "Terug naar website" link on login screen
- [x] AppWallet: Dutch translations for all transaction descriptions
- [x] AppWallet: "Opwaarderen" button added
- [x] Bottom nav: improved active state visibility
- [x] UX test report across all 7 app pages

## Phase 21: Text Visibility Fixes (DONE)
- [x] Audit all pages for invisible/hard-to-read text on dark backgrounds
- [x] Fix CrmPipeline, CrmLeadDetail, CrmCampaigns, CrmTemplates dark theme colors
- [x] Fix NotFound, BundlesPage, Home page contrast issues
- [x] Ensure all form inputs, labels, placeholders are readable

## Phase 22: CRM Trigger System & AI Actions (DONE)
- [x] Database: triggers table, trigger logs, website visitors (5 new tables)
- [x] Trigger types: website visit, lead created, pipeline stage change, form submit, inactivity
- [x] AI action engine: auto-enrich, auto-score, auto-outreach, auto-assign
- [x] Trigger builder UI (/crm/triggers) with create/edit/toggle triggers
- [x] Trigger execution log (what fired, what action taken, result)
- [x] LeadInfo-style website visitor detection (/crm/visitors) → deep company analysis
- [x] Check visitor against existing pipeline (new vs returning vs lost)
- [x] Personalized outreach generation based on visitor context

## Phase 23: Lead Manual Entry + AI Enrichment (DONE)
- [x] Quick-add lead (/crm/new-lead): only name required
- [x] AI Enrich button: auto-fill company, title, LinkedIn, email, phone, website
- [x] AI company analysis: revenue, headcount, industry, tech stack, funding
- [x] AI lead scoring based on enriched data
- [x] Duplicate detection (check if lead/company already in pipeline)

## Phase 24: Member Database with Tiers (DONE)
- [x] Member tiers: Gebaloteerd (full member), Vergaderen (meeting access), Prospect (credit bundle)
- [x] Comprehensive member overview page (/members) with advanced filters
- [x] Filter by: tier, status, search (name/email/company)
- [x] Member stats: total, per tier, active, new this month
- [x] Tier management with upgrade/downgrade actions

## Phase 25: Re-engagement Funnel (Community Transition) (DONE)
- [x] Funnel page (/re-engagement) for old contacts → besloten community transition
- [x] "Sleutel geven" flow: invite old funnel contacts to exclusive community
- [x] AI-generated personalized invite generation
- [x] Track funnel progress (identified → invited → opened → applied → accepted/declined)
- [x] Funnel stage counts and filter by stage
- [x] 145 tests passing, 0 TS errors

## Phase 26: Next-Level Parking Platform (DONE)
- [x] Database: parking_pools, parking_pool_members, parking_access_log, parking_visitor_permits, parking_sla_violations, parking_capacity_snapshots (6 new tables)
- [x] Database: extended parking_zones with overbooking fields (overbookingEnabled, overbookingRatio, noShowRateAvg, costUnderbooking, costOverbooking, payPerUseEnabled, payPerUseThreshold)
- [x] Database: extended parking_permits with poolId, slaTier, noShowCount, penaltyPoints
- [x] Database: extended parking_sessions with poolId, entryMethod, accessType
- [x] Capacity Engine (server/parking/capacityEngine.ts): real-time capacity calculation, overbooking model based on Critical Ratio (Cu/(Cu+Co)), pool FCFS logic
- [x] Pool subscription model: N guaranteed spots for M members, overflow billing (per-hour + day cap)
- [x] SLA tier system: Platinum (100% guarantee, fixed spot) → Gold (99.5%) → Silver (95%) → Bronze (off-peak only)
- [x] Access Decision Engine: priority-based gate control (Platinum → Gold → Pool guaranteed → Silver → Pool overflow → Bronze → Pay-per-use → Visitor)
- [x] ANPR/QR access webhook: requestAccess endpoint for barrier/camera integration
- [x] Visitor permits: QR-based guest access with WhatsApp/email/SMS sharing
- [x] Visitor landing page (/parking/visitor/:qrToken) with QR display and instructions
- [x] SLA violation tracking with automatic compensation calculation per tier
- [x] Overbooking advisor: headroom calculation, risk level assessment, permit issuance guidance
- [x] Capacity snapshots for analytics and peak prediction
- [x] Admin: Pools tab (create pool, view members, live pool status with guaranteed/overflow breakdown)
- [x] Admin: Yield Management tab (per-zone overbooking metrics, critical ratio, headroom, no-show rate)
- [x] Admin: Access Log tab (entry/exit events, method, latency, granted/denied status)
- [x] Admin: SLA violations summary card
- [x] Admin: enhanced stats cards (pool, visitors, pay-per-use, revenue breakdown)
- [x] Admin: enhanced sessions table with access type and entry method columns
- [x] Admin: enhanced permits list with SLA tier badges
- [x] Member App: live pool status card (guaranteed spots bar, overflow indicator, pricing)
- [x] Member App: invite visitor flow (WhatsApp + QR link sharing)
- [x] Member App: live zone capacity with occupancy breakdown
- [x] Member App: active session card with access type and entry method
- [x] SQL migration: 0010_parking_pools_upgrade.sql
- [x] 4 new tRPC routers: parkingPools, parkingAccess, parkingVisitorPermits, parkingSla
- [x] Route registration in routers.ts and App.tsx
