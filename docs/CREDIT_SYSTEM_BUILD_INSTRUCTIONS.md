# Technische Ontwerp- en Bouwinstructie: Credit Systeem Platform

Dit document bevat de technische en functionele vereisten voor het bouwen van een geavanceerd credit systeem voor kantoorruimtes, vergaderzalen en kiosk-aankopen. Deze instructie is bedoeld voor het development team (backend, frontend en database engineers) en is gebaseerd op de best practices uit de SaaS- en coworking-industrie.

---

## 1. Kernconcepten en Datamodellen

Het systeem moet twee fundamentele eenheden van waarde ondersteunen: **Credits** (voor tijd/ruimte) en **Coins** (voor directe monetaire waarde).

### 1.1. Entiteiten en Definities

*   **Credit (`Credit`):** Een abstracte eenheid gebruikt voor het boeken van resources (bureaus, vergaderzalen). De waarde is variabel en wordt bepaald door de resource (bijv. Standaard Bureau = 1 credit/uur, Premium Vergaderzaal = 3 credits/uur).
*   **Coin (`Coin`):** Een eenheid met een vaste monetaire waarde (bijv. 1 Coin = €1,00). Wordt primair gebruikt in de kiosk voor Food & Beverage, printen en merchandise.
*   **Wallet (`Wallet`):** Een container voor Credits en Coins. Gekoppeld aan een entiteit (Gebruiker of Bedrijf).
*   **Ledger (`LedgerEntry`):** Een immutable (onveranderlijke) log van alle transacties. Elke toevoeging, afschrijving of expiratie van credits/coins moet hierin worden vastgelegd.

### 1.2. Database Schema (Conceptueel)

Het datamodel moet de volgende relaties ondersteunen:

**Tabel: `Wallet`**
*   `id` (UUID)
*   `type` (Enum: `PERSONAL`, `COMPANY`)
*   `owner_id` (UUID van User of Company)
*   `balance_credits` (Integer)
*   `balance_coins` (Decimal)
*   `status` (Enum: `ACTIVE`, `FROZEN`)

**Tabel: `CreditBundle` (Nieuw)**
(Definieert de beschikbare pakketten en de kortingsstructuur gebaseerd op looptijd)
*   `id` (UUID)
*   `name` (String, bijv. "Team Pack 500")
*   `credits_per_month` (Integer)
*   `base_price_monthly` (Decimal, de prijs zonder korting)
*   `is_one_off` (Boolean, true voor eenmalige aankopen)

**Tabel: `BundlePricing` (Nieuw)**
(Koppelt de bundel aan de looptijd-kortingen)
*   `bundle_id` (FK naar CreditBundle)
*   `duration_months` (Integer: 0 voor eenmalig, 1, 6, 12, 24, 36)
*   `discount_percentage` (Decimal)
*   `final_price` (Decimal)

**Tabel: `CreditBatch`**
(Credits moeten in batches worden opgeslagen om expiratie en rollover te beheren)
*   `id` (UUID)
*   `wallet_id` (FK naar Wallet)
*   `bundle_id` (FK naar CreditBundle, nullable)
*   `amount_initial` (Integer)
*   `amount_remaining` (Integer)
*   `valid_from` (Timestamp)
*   `expires_at` (Timestamp, nullable)
*   `type` (Enum: `SUBSCRIPTION`, `ONE_OFF`, `BONUS`, `ROLLOVER`)

**Tabel: `TransactionLedger`**
*   `id` (UUID)
*   `wallet_id` (FK naar Wallet)
*   `credit_batch_id` (FK naar CreditBatch, nullable)
*   `amount` (Integer/Decimal, positief voor storting, negatief voor afschrijving)
*   `currency_type` (Enum: `CREDIT`, `COIN`)
*   `transaction_type` (Enum: `PURCHASE`, `BOOKING`, `KIOSK`, `EXPIRATION`, `REFUND`)
*   `reference_id` (FK naar Booking ID of Order ID)
*   `created_at` (Timestamp)

---

## 2. Bundel Systeem en Kortingsmatrix (Pricing Engine)

Om bedrijven te motiveren voor langjarige contracten te kiezen, moet het systeem een dynamische pricing engine bevatten. Eenmalige aankopen (pay-as-you-go) moeten substantieel duurder zijn om de overstap naar een abonnement te forceren.

### 2.1. Kortingslogica op Looptijd
De backend moet de prijs van een bundel dynamisch berekenen op basis van de gekozen looptijd (`duration_months`). De referentieprijs (0% korting) is de prijs voor een maandelijks opzegbaar abonnement.

| Looptijd | Korting t.o.v. Maandprijs | Strategisch Doel |
| :--- | :--- | :--- |
| **Eenmalig (One-off)** | **+30% Premium (Toeslag)** | Maakt pay-as-you-go onaantrekkelijk, stimuleert abonnement |
| **1 Maand (Flex)** | 0% (Base Price) | Genereert cashflow, lage drempel |
| **6 Maanden** | 10% Korting | Eerste stap naar lock-in |
| **12 Maanden** | 20% Korting | Standaard B2B contract |
| **24 Maanden** | 30% Korting | Enterprise lock-in |
| **36 Maanden** | 40% Korting | Maximale retentie |

### 2.2. Voorbeeld Berekening (Team Pack 500 Credits)
Stel de basisprijs (`base_price_monthly`) voor 500 credits per maand is €1.000,- (€2,00 per credit). De API berekent de prijzen als volgt:

*   **Eenmalige aankoop (500 credits, geen abonnement):** €1.000 + 30% = **€1.300,-** (€2,60 per credit)
*   **Maand-tot-maand abonnement:** **€1.000,- / maand** (€2,00 per credit)
*   **12-Maanden contract:** €1.000 - 20% = **€800,- / maand** (€1,60 per credit)
*   **36-Maanden contract:** €1.000 - 40% = **€600,- / maand** (€1,20 per credit)

### 2.3. Implementatie in de API
Wanneer de frontend de prijzen opvraagt via `GET /api/v1/bundles`, moet de API de volledige matrix retourneren zodat de frontend de "Bespaar X%" badges kan tonen. Bij het afsluiten van een contract (via `POST /api/v1/subscriptions`), slaat de backend de gekozen `duration_months` op en past de corresponderende `final_price` toe via de billing provider (bijv. Stripe).

---

## 3. Wallet Architectuur en Logica

De backend moet strikte scheiding en logica hanteren tussen persoonlijke en bedrijfs-wallets.

### 3.1. Persoonlijke Wallet (`PERSONAL`)
*   **Eigenaar:** 1-op-1 gekoppeld aan een `User`.
*   **Vulling:** Via individuele eenmalige aankopen of persoonlijke B2C-abonnementen.
*   **Zichtbaarheid:** Alleen zichtbaar voor de specifieke gebruiker.

### 3.2. Company Wallet (`COMPANY`)
*   **Eigenaar:** Gekoppeld aan een `Company` entiteit. Meerdere `Users` (werknemers) kunnen lees/schrijf-rechten hebben op deze wallet.
*   **Vulling:** Via B2B-abonnementen (bundels met looptijd-korting) of handmatige toewijzing door een admin.
*   **Budget Controls (Cruciaal voor Enterprise):** De backend moet limieten kunnen afdwingen per gebruiker binnen de company wallet.
    *   *Vereiste feature:* Tabel `CompanyWalletLimit` met `user_id`, `wallet_id`, `max_credits_per_month`.
    *   Bij elke afschrijving moet de backend controleren of de individuele limiet van de medewerker niet is overschreden.

### 3.3. Transactie Logica (Checkout Flow)
Wanneer een gebruiker een boeking maakt of iets afrekent in de kiosk, moet de API de volgende logica volgen:
1.  Haal beschikbare wallets op voor de gebruiker (zijn `PERSONAL` wallet + eventuele `COMPANY` wallet waar hij aan gekoppeld is).
2.  Frontend toont beide opties (mits er voldoende saldo is).
3.  Bij afschrijving: het systeem moet **First-In-First-Out (FIFO)** toepassen op de `CreditBatch` tabel, waarbij batches met de dichtstbijzijnde `expires_at` datum als eerste worden afgeschreven.

---

## 4. Expiratie en Rollover Engine (CRON Jobs)

Het systeem vereist een robuuste achtergrondtaak (worker/CRON) om de levenscyclus van credits te beheren. Dit is het hart van het lock-in mechanisme.

### 4.1. Expiratie Service
*   **Taak:** Dagelijks (of per uur) controleren welke `CreditBatch` records de `expires_at` datum zijn gepasseerd en waar `amount_remaining > 0`.
*   **Actie:** Maak een negatieve `TransactionLedger` entry aan met type `EXPIRATION` en zet `amount_remaining` op 0.

### 4.2. Rollover Logica (Gekoppeld aan Looptijd)
Net als de prijs, moet ook het rollover-percentage gekoppeld zijn aan de contractduur. Langere contracten krijgen betere rollover-voorwaarden.

| Looptijd Contract | Rollover Percentage |
| :--- | :--- |
| Eenmalig / 1 Maand | 0% (Use-it-or-lose-it) |
| 6 Maanden | 10% van maandelijkse bundel |
| 12 Maanden | 20% van maandelijkse bundel |
| 24+ Maanden | 30% van maandelijkse bundel |

*   **Logica bij maandovergang:** 
    1. Bereken totaal resterende credits uit de vorige maand.
    2. Haal het rollover-percentage op gebaseerd op de contractduur.
    3. Bereken het maximale rollover bedrag.
    4. Expireer de oude batch.
    5. Creëer een nieuwe `CreditBatch` met type `ROLLOVER` en de berekende hoeveelheid, met een nieuwe `expires_at` (+1 maand).

---

## 5. Kiosk en Externe Gebruikers (POS API)

De kiosk applicatie (frontend) communiceert met een specifieke POS (Point of Sale) API.

### 5.1. Authenticatie en Identificatie
*   **Leden (Interne gebruikers):** Identificatie via RFID/NFC tag, QR-code in de app, of pincode. Na identificatie haalt de kiosk de beschikbare Wallets op.
*   **Gasten (Externe gebruikers):** Geen account nodig. Gebruiken de "Quick Sale" flow.

### 5.2. Quick Sale Flow (Externe Gebruikers)
Voor gasten die een Day Pass of een kop koffie willen kopen:
1.  Gebruiker selecteert producten op de kiosk.
2.  Kiosk roept de payment provider (bijv. Stripe Terminal / Adyen) aan voor een directe pin/creditcard betaling.
3.  Na succesvolle betaling genereert de backend een "Guest Order" zonder dat er een `User` of `Wallet` record wordt aangemaakt.
4.  *Optioneel (Conversie optimalisatie):* Print een bonnetje met een unieke claim-code. Als de gast binnen 7 dagen een account aanmaakt via de website, kan hij deze code invoeren om het bestede bedrag als bonus-credits in zijn nieuwe `PERSONAL` wallet te ontvangen.

---

## 6. Pricing en Billing Integratie (bijv. Stripe)

Het platform moet integreren met een billing engine (zoals Stripe Billing) om de financiële kant te beheren.

### 6.1. Abonnementen (Subscriptions)
*   Koppel Stripe Subscriptions aan de interne Wallet. De `duration_months` bepaalt de Stripe Price ID die wordt gebruikt.
*   Gebruik webhooks (`invoice.paid`) om maandelijks de `COMPANY` of `PERSONAL` wallet aan te vullen met nieuwe `CreditBatches`.

### 6.2. Enterprise Commit Contracts (Prepaid Drawdown)
*   Bedrijf betaalt vooraf het volledige bedrag voor 12, 24 of 36 maanden via een Stripe Invoice.
*   Backend creëert periodiek (maandelijks) een `CreditBatch` in de `COMPANY` wallet, of stort alles in één keer afhankelijk van de afspraak.

### 6.3. Overage Policy
*   Als een wallet onvoldoende credits heeft voor een boeking, weigert de API dit (`INSUFFICIENT_CREDITS`).
*   De frontend toont een upsell: "Koop eenmalig 50 credits bij." Hierbij wordt expliciet de **+30% eenmalige toeslag** gerekend, wat de gebruiker motiveert om zijn maandelijkse bundel structureel te verhogen in plaats van los bij te kopen.

---

## 7. API Endpoints (Core)

Een overzicht van de essentiële REST/GraphQL endpoints die gebouwd moeten worden:

*   `GET /api/v1/bundles` - Haal alle beschikbare bundels op inclusief de volledige kortingsmatrix op looptijden.
*   `GET /api/v1/wallets` - Haal alle wallets (Personal + Company) op voor de ingelogde gebruiker.
*   `GET /api/v1/wallets/{id}/transactions` - Haal de ledger history op voor transparantie.
*   `POST /api/v1/subscriptions` - Sluit een nieuw contract af (vereist `bundle_id` en `duration_months`).
*   `POST /api/v1/bookings/calculate` - Bereken de kosten van een boeking (in credits).
*   `POST /api/v1/bookings` - Maak een boeking. Payload bevat `wallet_id` waaruit afgeschreven moet worden.
*   `POST /api/v1/kiosk/checkout` - Verwerk een kiosk bestelling.
*   `POST /api/v1/admin/company/{id}/limits` - Stel budgetlimieten in per medewerker.

---

## 8. Veiligheid en Concurrency

Omdat Credits een financiële waarde vertegenwoordigen, moet het systeem extreem robuust zijn tegen race conditions.

*   **Database Transactions:** Elke afschrijving moet in een ACID-compliant database transactie gebeuren.
*   **Row-Level Locking:** Gebruik `SELECT ... FOR UPDATE` op de `Wallet` en `CreditBatch` rijen tijdens het afschrijven om dubbele uitgaven (double-spending) te voorkomen.
*   **Idempotency:** Alle API endpoints die credits afschrijven moeten idempotency keys ondersteunen, zodat een netwerk-retry niet leidt tot dubbele afschrijvingen.
