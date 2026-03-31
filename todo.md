# NET OS Platform TODO

## Phase 1: Database & Backend Foundation
- [x] Database schema (locations, resources, companies, wallets, credits, bookings, visitors, devices, sensors)
- [x] Seed data for 7 locations and resource types
- [x] Backend API routers (tRPC)
- [x] Auth flow with role-based access (admin/member/guest)

## Phase 2: Credit Engine & Booking
- [x] Credit engine with dual wallet (company + personal)
- [x] Rollover rule engine (max rollover = bundle size)
- [x] Dynamic day/time multipliers (0.45x - 1.4x)
- [x] Double-entry credit ledger
- [x] Breakage revenue tracking
- [ ] Stripe subscription billing for credit bundles (placeholder - requires Stripe keys)
- [ ] Stripe in-app payments for personal wallet top-ups (placeholder - requires Stripe keys)
- [x] Booking system with multiplier calculation
- [x] Zone-based access control (Zone 0-3)
- [ ] Map-based booking interface

## Phase 3: Frontend UI
- [x] Elegant dark theme with premium design
- [x] Landing page / public homepage
- [x] Admin dashboard with sidebar navigation
- [x] Member portal with credit balance, quick actions
- [x] Location selector (7 locations)
- [x] Resource booking interface (per location)
- [x] Company management dashboard
- [x] Company wallet & usage dashboards
- [x] Volume discount tiers (Bronze/Silver/Gold)
- [x] Credit bundles pricing page
- [x] Wallet page with dual wallet display

## Phase 4: Signing, Visitors & Notifications
- [x] Signing platform (logo, colors, photos upload UI)
- [x] Dynamic branding display preview
- [x] Visitor management with invite flow
- [x] License plate registration
- [ ] SMS/WhatsApp deep link invites (requires external service)
- [ ] Salto KS integration endpoints (requires Salto KS API keys)
- [x] NETOS device management page
- [x] Notifications page
- [x] Invites page with access tiers

## Phase 5: Testing & Delivery
- [x] Vitest unit tests for critical paths (9 tests passing)
- [x] Final UI polish and responsive design
- [x] Checkpoint and delivery
