# Sprint Workflow — Netos Platform

## Overzicht

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐     ┌─────────────┐
│  Sprint      │────▶│  Agents      │────▶│  CI Pipeline │────▶│  Sprint     │
│  Planning    │     │  Bouwen      │     │  Validatie   │     │  Review     │
└─────────────┘     └──────────────┘     └──────────────┘     └──────┬──────┘
                                                                      │
       ┌──────────────────────────────────────────────────────────────┘
       │
       ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Stakeholder │────▶│  Feedback    │────▶│  Volgende    │
│  Testing     │     │  Verwerken   │     │  Sprint      │
└──────────────┘     └──────────────┘     └──────────────┘
```

---

## Stap 1: Sprint Planning

1. Open `shared/feature-registry.ts`
2. Bekijk welke modules status `demo` of `beta` hebben
3. Kies 2-3 modules om naar het volgende level te brengen
4. Maak GitHub Issues aan met label `sprint:X` en `agent:manus` of `agent:claude`
5. Wijs elke agent een niet-overlappende module toe

**Voorbeeld:**
- Sprint 2: Wallet (demo → beta): Stripe checkout implementeren → `agent:claude`
- Sprint 2: Room Control (demo → beta): Live sensor data → `agent:manus`

---

## Stap 2: Agents Bouwen

Elke agent werkt op een eigen feature branch:

```bash
# Manus werkt aan room control
git checkout -b manus/room-control-live-sensors

# Claude werkt aan wallet/stripe
git checkout -b claude/stripe-checkout
```

**Regels (zie AGENTS.md):**
- Minimaal tests toevoegen
- Geen direct push naar main
- PR openen wanneer klaar

---

## Stap 3: CI Pipeline Validatie

Bij elke PR draait automatisch:
- ✅ TypeScript type check
- ✅ Lint check
- ✅ Vitest tests (alle 145+ moeten slagen)
- ✅ Build check

PR kan pas gemerged worden als alles groen is.

---

## Stap 4: Sprint Review

Na het mergen van alle sprint-PRs:

1. **Feature Registry updaten**: Wijzig status in `shared/feature-registry.ts`
2. **CHANGELOG.md bijwerken**: Voeg nieuwe sprint sectie toe
3. **Review meeting**: Loop met stakeholders door de modules

---

## Stap 5: Stakeholder Testing

### Wie test wat?

| Rol | Focus | Test Modules |
|-----|-------|-------------|
| **Administrator** | Alles: security, users, financiën | Alle modules |
| **Host / Receptionist** | Dagelijkse operatie | Kiosk, Signing, Visitors, Operations |
| **Boss / Bedrijfsleider** | Bedrijfszaken | Bookings, Wallet, Contracten, Teamleden |
| **Lid / Huurder** | Dagelijks gebruik | Boeken, Betalen, App, Support |
| **Bezoeker** | Eerste indruk | Signing, WiFi, Check-in |
| **Facility Manager** | Gebouwbeheer | Room Control, Parking, Sensoren |
| **Developer / Agent** | Technisch | API, Tests, Performance |

### Test Protocol per Module

Elke tester vult voor hun module(s) in:

1. **Werkt het?** — Ja / Deels / Nee / Niet getest
2. **Wat werkt** — Concrete stappen die lukten
3. **Wat mist** — Wat verwachtte je dat er niet was?
4. **Praktijkgebruik** — Hoe zou je dit dagelijks gebruiken?
5. **Suggesties** — Ideeën voor verbetering

---

## Stap 6: Feedback Verwerken

1. Verzamel alle feedback per module
2. Maak GitHub Issues aan voor elk feedbackpunt:
   - Label: `feedback`, `module:<naam>`, `priority:<level>`
   - Wijs toe aan de juiste agent
3. Update `shared/feature-registry.ts`:
   - Voeg nieuwe `knownIssues` toe
   - Update `missingIntegrations`
4. Plan issues in voor de volgende sprint

---

## Stap 7: Heartbeat Monitoring

Het heartbeat systeem checkt continu de gezondheid van het platform:

### Module Heartbeat (al aanwezig voor Signage)
Breid uit naar alle modules:

```typescript
// Elke module rapporteert:
{
  moduleId: "booking",
  status: "online" | "degraded" | "offline",
  lastCheck: Date,
  responseTimeMs: number,
  errorCount: number
}
```

### Scheduled Health Check
Een Cowork scheduled task draait periodiek en rapporteert:
- Welke modules online zijn
- Welke tests falen
- Welke PRs open staan
- Feature status overzicht

---

## Sprint Cadence

```
Week 1: Planning + Agent toewijzing
Week 2: Agents bouwen + CI checks
Week 3: Merge + Stakeholder testing
Week 4: Feedback verwerken + Volgende sprint plannen
```

---

## Quick Commands

```bash
# Bekijk huidige module status
grep -E "status:|id:" shared/feature-registry.ts

# Draai alle tests
pnpm vitest run

# Check open PRs
gh pr list

# Check CI status
gh run list

# Maak een sprint review issue
gh issue create --title "Sprint X Review" --label "sprint-review"
```
