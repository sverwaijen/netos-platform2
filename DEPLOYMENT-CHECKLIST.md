# The Green Platform — Deployment Checklist

**Last audited:** 2026-04-09
**Status:** 164/164 tests passing | Supabase PG primary | Stripe test mode active

---

## Current State Summary

| Category | Status |
|----------|--------|
| Database | 65 tables in Supabase PG, 25 with data, 40 empty |
| Auth | OAuth working, session persistence confirmed |
| Payments | Stripe test mode, checkout + webhook working |
| Frontend | 40+ pages ported, all rendering |
| Tests | 164/164 passing |
| Integrations | Salto KS, UniFi, Supabase Realtime — coded but not connected |

---

## PRIORITY 1 — Must Fix Before Go-Live

### 1.1 Stripe: Claim Sandbox & Go Live
- [ ] Claim Stripe test sandbox: https://dashboard.stripe.com/claim_sandbox/YWNjdF8xVEtKTVZEQ1JMdEZUTkltLDE3NzYzNjI5MTcv100dIDmT4J0 (expires 2026-06-08)
- [ ] Test a full payment with card `4242 4242 4242 4242`
- [ ] Complete Stripe KYC verification for live keys
- [ ] Enter live keys in Settings → Payment
- [ ] Verify webhook delivery in Stripe Dashboard → Developers → Webhooks

### 1.2 Parking Module: Seed Real Data
- [ ] Parking tables are **all empty** (zones, spots, sessions, permits, reservations, pricing)
- [ ] Seed or import real parking zone data for your 7 locations
- [ ] Configure parking pricing rules
- [ ] "Vergunning toevoegen" button is placeholder (shows toast "coming soon")

### 1.3 Missing Database Tables
These tables exist in the PG schema but have **no data** and likely need real content:

| Table | Purpose | Action Needed |
|-------|---------|---------------|
| `parking_zones` | Parking zone definitions | Import real zone data per location |
| `parking_spots` | Individual parking spots | Import real spot layout |
| `parking_pricing` | Pricing rules per zone | Configure pricing |
| `products` / `product_categories` | Butler Kiosk products | Add real product catalog |
| `member_profiles` | Extended member info | Populated on member registration |
| `sensors` / `room_sensor_readings` | IoT sensor data | Needs hardware integration |
| `tickets` / `ticket_messages` / `ticket_sla_policies` | Support ticket system | Build or connect support flow |
| `canned_responses` | Quick reply templates for support | Add templates |
| `company_branding` / `company_branding_scraped` | Company brand assets | Populated via scraper on company add |
| `employee_photos` | Company employee photos | Uploaded by companies |
| `crm_triggers` / `crm_trigger_logs` | Automated CRM triggers | Configure trigger rules |
| `crm_website_visitors` | Website visitor tracking | Needs tracking pixel/script |
| `room_automation_rules` | Automated room control rules | "Regel toevoegen" is placeholder |
| `ops_agenda` | Operations agenda items | Used by Operations Dashboard |
| `reengagement_funnel` | Re-engagement campaign data | Used by Re-Engagement page |
| `booking_addons` | Add-ons for bookings | Define available add-ons |
| `resource_amenity_map` | Links amenities to resources | Map amenities to specific resources |
| `resource_blocked_dates` | Blocked dates for resources | Set holiday/maintenance dates |
| `resource_categories` | Resource category grouping | Define categories |

### 1.4 Home Page Contact Form
- [ ] Landing page contact form (`Home.tsx`) has input fields but **no submit handler** — form data goes nowhere
- [ ] Wire form to CRM lead creation or email notification

---

## PRIORITY 2 — Features That Need Completion

### 2.1 External Integrations (Coded, Not Connected)

| Integration | Required Env Vars | Status |
|-------------|-------------------|--------|
| **Salto KS** (door access) | `SALTO_KS_API_URL`, `SALTO_KS_CLIENT_ID`, `SALTO_KS_CLIENT_SECRET`, `SALTO_KS_SITE_ID` | Code ready, needs API credentials |
| **UniFi Identity** (WiFi) | `UNIFI_CONTROLLER_URL`, `UNIFI_USERNAME`, `UNIFI_PASSWORD`, `UNIFI_SITE` | Code ready, needs controller access |
| **Supabase Realtime** | Already configured | Sync functions exist (`syncUserToSupabase`, `syncParkingEvent`, `syncTicketEvent`) but not auto-triggered on mutations |

### 2.2 Butler Kiosk
- [ ] Product catalog is empty (`products`, `product_categories` tables = 0 rows)
- [ ] `ButlerKiosk.tsx` line 83: `locationId: 1` is hardcoded — needs kiosk location detection
- [ ] Kiosk ordering flow needs real product data to function

### 2.3 Operations Dashboard
- [ ] `ops_agenda` table is empty — no agenda items
- [ ] Operations Dashboard needs real operational data feeds

### 2.4 Support Tickets
- [ ] `tickets`, `ticket_messages`, `ticket_sla_policies` tables are empty
- [ ] No visible ticket creation UI in the member app
- [ ] SLA policies need to be defined

### 2.5 Signing Page
- [ ] Photo upload button shows toast "Photo upload coming soon" (placeholder)
- [ ] Digital signing flow needs completion

### 2.6 Room Control
- [ ] "Regel toevoegen" button is placeholder (toast "coming soon")
- [ ] "Alert toevoegen" button is placeholder (toast "coming soon")
- [ ] `room_automation_rules` table is empty
- [ ] `sensors` / `room_sensor_readings` tables are empty — needs IoT hardware connection

### 2.7 Re-Engagement Funnel
- [ ] `reengagement_funnel` table is empty
- [ ] Page exists but has no data to display

### 2.8 CRM Triggers & Website Visitors
- [ ] `crm_triggers` table is empty — no automated triggers configured
- [ ] `crm_website_visitors` table is empty — needs tracking pixel/script on external website
- [ ] `crm_trigger_logs` table is empty

### 2.9 Payment History Page
- [ ] No `/payments` or `/orders` page exists yet for users to view their payment history
- [ ] Stripe Customer Portal link exists but needs testing

---

## PRIORITY 3 — Polish & Production Readiness

### 3.1 TypeScript Errors
- [ ] 96 pre-existing TS errors (mostly `implicit any` in `opsRouter.ts` and client pages)
- [ ] Not blocking runtime, but should be cleaned for production builds

### 3.2 Logout Flow
- [ ] Logout not tested yet — needs browser verification

### 3.3 Member App (`/app/*`)
- [ ] 7 member-facing pages exist (Home, Bookings, Wallet, Access, Parking, Support, Profile)
- [ ] Access page depends on Salto KS integration
- [ ] Support page depends on ticket system
- [ ] Parking page depends on parking data

### 3.4 Security & RLS
- [ ] Supabase Row Level Security policies exist on skynet_ mirror tables only
- [ ] Main app tables have no RLS — all access goes through server-side auth
- [ ] Consider adding RLS if exposing Supabase directly to mobile app

### 3.5 MySQL Fallback Cleanup
- [ ] Dual-driver (PG + MySQL) is active — MySQL code can be removed once PG is stable in production
- [ ] Remove `drizzle/schema.ts` (MySQL) and keep only `drizzle/pg-schema.ts`
- [ ] Simplify `db.ts` to PG-only

### 3.6 Domain & SSL
- [ ] Current domains: `netosplat-ejqjprwu.manus.space`, `thegreen.manus.space`
- [ ] Configure custom domain (e.g., `platform.thegreen.nl`) via Settings → Domains
- [ ] Verify SSL certificate

### 3.7 Notifications
- [ ] `notifications` table is empty
- [ ] Notification system exists but no triggers are configured to create notifications

---

## Database Data Summary (65 tables)

### Tables WITH Data (25)
| Table | Rows | Notes |
|-------|------|-------|
| users | 1 | Admin (sam@green-dna.nl) |
| locations | 7 | All 7 The Green locations |
| resources | 504 | 72 per location |
| credit_bundles | 6 | Free → Full Time plans |
| companies | 5 | Seed companies |
| wallets | 1 | Admin wallet |
| bookings | 3 | Test bookings |
| visitors | 3 | Test visitors |
| devices | 175 | 25 per location |
| invites | 12 | Test invites |
| access_log | 3 | Test entries |
| day_multipliers | 49 | 7 days × 7 locations |
| resource_types | 10 | Desk, Office, Meeting Room, etc. |
| resource_rates | 18 | Hourly/daily/weekly rates |
| resource_amenities | 20 | WiFi, Coffee, Printer, etc. |
| resource_rules | 8 | Booking rules |
| resource_schedules | 42 | 6 per location |
| booking_policies | 3 | Cancellation policies |
| crm_leads | 12 | Test leads |
| crm_campaigns | 6 | Test campaigns |
| crm_campaign_steps | 6 | Campaign steps |
| crm_email_templates | 5 | Email templates |
| crm_lead_activities | 18 | Lead activity log |
| credit_ledger | 12 | Transaction history |
| room_control_zones | 7 | 1 per location |
| room_control_points | 42 | 6 per zone |
| alert_thresholds | 7 | 1 per zone |

### Tables WITHOUT Data (40)
All parking tables, products, members, sensors, tickets, notifications, automation rules, re-engagement, and CRM triggers/visitors.

---

## Recommended Deployment Order

1. **Claim Stripe sandbox** → test payment → go live with real keys
2. **Wire contact form** on landing page to CRM or email
3. **Seed parking data** for at least 1 location to make Parking module functional
4. **Add kiosk products** to make Butler Kiosk functional
5. **Connect Salto KS** for door access (needs API credentials from Salto)
6. **Connect UniFi** for WiFi provisioning (needs controller access)
7. **Configure CRM triggers** for automated lead follow-up
8. **Add tracking pixel** for CRM website visitor tracking
9. **Build payment history page** (`/payments`)
10. **Clean up TS errors** and remove MySQL fallback code
11. **Configure custom domain** and publish
