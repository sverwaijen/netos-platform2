# AGENTS.md — Skynet Platform Multi-Agent Guidelines

Dit bestand is de "huisregels" voor alle AI-agents die aan deze codebase werken.
Elke agent (Manus, Claude, Cursor, Copilot, etc.) MOET dit bestand lezen voordat er code geschreven wordt.

---

## Project Overzicht

**Skynet Platform** is een autonoom kantoor-besturingssysteem (SaaS) voor Mr. Green Boutique Offices.

- **Frontend:** React 19 + TailwindCSS 4 + Radix UI + Vite
- **Backend:** Express + tRPC + Drizzle ORM
- **Taal:** TypeScript (strict mode)
- **Package manager:** pnpm 10.4.1
- **Tests:** Vitest
- **Database:** PostgreSQL via Drizzle ORM

---

## Regels voor Agents

### 1. Branch Strategie

- **NOOIT** direct naar `main` pushen
- Maak altijd een feature branch aan met dit format:
  ```
  <agent-naam>/<feature-beschrijving>
  ```
  Voorbeelden:
  - `manus/stripe-checkout`
  - `claude/salto-ks-integration`
  - `cursor/booking-e2e-tests`
- Open een Pull Request naar `main` of `develop`
- PR moet CI checks passeren voordat merge mogelijk is

### 2. Code Stijl & Conventies

- **TypeScript strict** — geen `any` types tenzij absoluut noodzakelijk
- **Naamgeving:**
  - Componenten: PascalCase (`BookingCard.tsx`)
  - Utilities/hooks: camelCase (`useWallet.ts`)
  - API routers: camelCase (`bookingRouter.ts`)
  - Database tabellen: snake_case in Drizzle schema
- **Imports:** Gebruik `@/` path aliases waar beschikbaar
- **Styling:** Alleen TailwindCSS utility classes, geen inline styles of CSS modules
- **API:** Alle nieuwe endpoints via tRPC routers in `server/routers/`

### 3. Tests zijn Verplicht

Elke PR die nieuwe functionaliteit toevoegt MOET tests bevatten:

- **Minimaal:** Unit tests voor business logic en tRPC endpoints
- **Gewenst:** Integration tests voor volledige flows
- **Bestandsnaam:** `<feature>.test.ts` naast het bronbestand
- **Framework:** Vitest — gebruik `describe`, `it`, `expect`
- Draai `pnpm vitest run` lokaal voordat je pusht

### 4. Database Wijzigingen

- Gebruik Drizzle ORM voor alle schema changes
- Maak altijd een migratie aan: `pnpm drizzle-kit generate`
- Test migraties met seed data voordat je pusht
- Voeg seed scripts toe in `server/` als er nieuwe tabellen komen

### 5. Geen Breaking Changes

- Bestaande API endpoints mogen niet zomaar veranderen
- Als een endpoint-signature wijzigt, voeg een nieuw endpoint toe en markeer het oude als deprecated
- Alle bestaande tests moeten blijven slagen

### 6. Wat NIET te doen

- Geen hardcoded secrets of API keys in code (gebruik `.env`)
- Geen `console.log` in productie code (gebruik een logger)
- Geen nieuwe dependencies toevoegen zonder het in de PR te vermelden
- Geen demo/mock data in productie code — gebruik seed scripts
- Geen grote refactors zonder overleg (maak eerst een issue)

---

## Architectuur Overzicht

```
skynet-platform2/
├── client/              # React frontend (Vite)
│   ├── components/      # Herbruikbare UI componenten
│   ├── pages/           # Route-gebaseerde pagina's
│   ├── hooks/           # Custom React hooks
│   └── lib/             # Utilities en helpers
├── server/              # Express + tRPC backend
│   ├── routers/         # tRPC endpoint routers
│   ├── integrations/    # Externe services (Stripe, Salto, etc.)
│   └── _core/           # Core business logic
├── shared/              # Gedeelde types en schemas
├── drizzle/             # Database migraties
└── docs/                # Projectdocumentatie
```

---

## Feature Status & Taakverdeling

Controleer altijd **GitHub Issues** voordat je aan iets begint.
Neem een issue op, wijs het aan jezelf toe, en verwijs ernaar in je PR.

### Labels voor agents:
- `agent:manus` — Toegewezen aan Manus AI
- `agent:claude` — Toegewezen aan Claude
- `agent:cursor` — Toegewezen aan Cursor
- `agent:human` — Handmatig door ontwikkelaar

---

## Checklist voor elke PR

- [ ] Feature branch met correct naamformat
- [ ] TypeScript compileert zonder fouten (`tsc --noEmit`)
- [ ] Alle bestaande tests slagen (`pnpm vitest run`)
- [ ] Nieuwe tests toegevoegd voor nieuwe functionaliteit
- [ ] Geen hardcoded secrets
- [ ] PR beschrijving bevat: wat, waarom, en hoe te testen
- [ ] Gerelateerd GitHub Issue gelinkt
