# Changelog — Skynet Platform

Alle noemenswaardige wijzigingen aan het Skynet Platform worden hier bijgehouden.
Format is gebaseerd op [Keep a Changelog](https://keepachangelog.com/).

---

## [Sprint 1] — 2025-01 t/m 2025-04

### Phase 26 — Smart Parking Platform
- Parkeerplatform met zones, spots, dynamic pricing
- Permits, reserveringen en sessies
- Kenteken-gebaseerde toegang (mock)
- SLA tracking voor parkeerservice

### Phase 21-25 — CRM & Community
- CRM trigger systeem met AI action engine
- Lead manual entry met AI enrichment
- LeadInfo-style website visitor detection
- Member database met tiers (gebaloteerd/vergaderen/prospect)
- Re-engagement funnel voor community transitie
- 5 nieuwe database tabellen, 6 nieuwe pagina's

### Phase 17-19 — Room Control, Marketing & Member App
- Room Control met 13 zones, 84 control points, 1872 sensor readings
- CRM Marketing Flow met visuele 5-staps pipeline en 17 demo leads
- Member App (PWA) met 7 pagina's: Home, Bookings, Wallet, Access, Parking, Support, Profile

### Phase 16 — Mobile Responsiveness
- DashboardLayout met hamburger sidebar
- Alle pagina's mobile-first gemaakt
- overflow-x hidden op html/body

### Phase 11-15 — Parking, Operations, Room Control, Supabase
- Smart Parking (zones, spots, pricing, permits, reservations)
- Operations Dashboard (Zendesk-style tickets, AI-first handling, agenda, presence)
- Room Control (sensor monitoring, HVAC/lighting, automation rules)
- Supabase integratie (REST bridge, realtime, RLS policies)
- Mobile App architectuur (Salto KS + UniFi Identity)
- 16 nieuwe database tabellen, 3 nieuwe admin pagina's

### Phase 6-10 — Butler Kiosk & Signing
- Butler Kiosk POS met 45 producten in 8 categorieën
- Multi-payment support (credits, Stripe, PIN, invoice, cash)
- 34-inch kiosk signing display met auto-branding
- Website auto-scraper API
- Butler admin met product management en analytics
- Keukenscherm voor bestellingen

### Phase 3-5 — CRM & Design
- CRM/GTM outreach module met Kanban pipeline
- Lead detail met AI scoring/enrichment
- Campaign builder met email sequences
- Mr. Green huisstijl (Montserrat, #627653, #b8a472)
- Alle 7 locatiefoto's op CDN

### Phase 1-2 — Foundation
- 17 database tabellen, 50+ API endpoints
- Dual wallet credit engine
- Booking flow met time slots en dynamic pricing
- Resource management (917 resources over 7 locaties)
- Visitor management met deep links
- Signing platform met branding editor
- Device/IoT monitoring

---

## CI/CD & Tooling

### 2025-04-12
- GitHub Actions CI pipeline (TypeScript check, lint, tests, build)
- AGENTS.md met multi-agent conventies
- PR template met checklists
- Branch protection op main
- Feature registry & heartbeat systeem
- Sprint review workflow

---

## Module Status Overzicht

| Module | Status | Ontbrekende Integraties |
|--------|--------|------------------------|
| Dashboard | 🟡 Beta | — |
| Bookings | 🟡 Beta | Salto KS |
| Wallet & Credits | 🔴 Demo | Stripe |
| Locaties | 🟡 Beta | Google Maps live |
| Operations | 🟡 Beta | Email, WhatsApp |
| Room Control | 🔴 Demo | IoT, HVAC, Hue |
| CRM Pipeline | 🟡 Beta | LinkedIn, KvK |
| CRM Campaigns | 🔴 Demo | SendGrid/SMTP |
| Visitor Detection | 🔴 Demo | LeadInfo |
| Re-engagement | 🔴 Demo | Email automation |
| Butler Kiosk | 🟡 Beta | Stripe terminal, QR |
| Kitchen Prep | 🔴 Demo | WebSocket |
| Menu Management | 🟡 Beta | — |
| Smart Parking | 🟡 Beta | ANPR, sensoren |
| Signing Display | 🟡 Beta | — |
| Digital Signage | 🟡 Beta | — |
| ROZ Contracten | 🟡 Beta | DocuSign |
| Member PWA | 🔴 Demo | Salto KS, UniFi, Push |
| User Management | 🟡 Beta | SSO/OAuth |

**Totaal:** 19 modules — 6 demo, 12 beta, 0 productie, 1 disabled
