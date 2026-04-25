-- ROZ Huurovereenkomsten Module (PostgreSQL)

-- Add ROZ columns to resources table
ALTER TABLE resources ADD COLUMN IF NOT EXISTS "areaM2" decimal(8,2);
ALTER TABLE resources ADD COLUMN IF NOT EXISTS "isRozEligible" boolean DEFAULT false;
ALTER TABLE resources ADD COLUMN IF NOT EXISTS "rozContractType" varchar(64);
ALTER TABLE resources ADD COLUMN IF NOT EXISTS "rozServiceChargeModel" varchar(64) DEFAULT 'voorschot';
ALTER TABLE resources ADD COLUMN IF NOT EXISTS "rozVatRate" decimal(5,2) DEFAULT 21.00;
ALTER TABLE resources ADD COLUMN IF NOT EXISTS "rozIndexation" varchar(32) DEFAULT 'CPI';
ALTER TABLE resources ADD COLUMN IF NOT EXISTS "rozIndexationPct" decimal(5,2) DEFAULT 2.50;
ALTER TABLE resources ADD COLUMN IF NOT EXISTS "rozTenantProtection" boolean DEFAULT true;
ALTER TABLE resources ADD COLUMN IF NOT EXISTS "rozMinLeaseTerm" integer DEFAULT 1;
ALTER TABLE resources ADD COLUMN IF NOT EXISTS "rozNoticePeriodMonths" integer DEFAULT 3;

-- ROZ Pricing Tiers
CREATE TABLE IF NOT EXISTS roz_pricing_tiers (
  id serial PRIMARY KEY,
  "resourceId" integer,
  "resourceTypeId" integer,
  "locationId" integer,
  name varchar(128) NOT NULL,
  "periodType" text NOT NULL,
  "periodMonths" integer NOT NULL,
  "creditCostPerMonth" decimal(12,2) NOT NULL,
  "creditCostPerM2PerMonth" decimal(10,2),
  "discountPercent" decimal(5,2) DEFAULT 0.00,
  "serviceChargePerMonth" decimal(10,2) DEFAULT 0.00,
  "depositMonths" integer DEFAULT 3,
  "isActive" boolean DEFAULT true,
  "sortOrder" integer DEFAULT 0,
  "createdAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ROZ Contracts
CREATE TABLE IF NOT EXISTS roz_contracts (
  id serial PRIMARY KEY,
  "contractNumber" varchar(64) NOT NULL UNIQUE,
  "resourceId" integer NOT NULL,
  "locationId" integer NOT NULL,
  "userId" integer,
  "companyId" integer,
  "walletId" integer,
  "pricingTierId" integer,
  "periodType" text NOT NULL,
  "startDate" bigint NOT NULL,
  "endDate" bigint NOT NULL,
  "monthlyRentCredits" decimal(12,2) NOT NULL,
  "monthlyServiceCharge" decimal(10,2) DEFAULT 0.00,
  "depositAmount" decimal(12,2) DEFAULT 0.00,
  "depositPaid" boolean DEFAULT false,
  "indexationMethod" varchar(32) DEFAULT 'CPI',
  "indexationPct" decimal(5,2) DEFAULT 2.50,
  "lastIndexationDate" bigint,
  "nextIndexationDate" bigint,
  "noticePeriodMonths" integer DEFAULT 3,
  "noticeGivenDate" bigint,
  "rozTemplateVersion" varchar(32) DEFAULT '2024',
  "rozDocumentUrl" text,
  status text DEFAULT 'draft' NOT NULL,
  notes text,
  "createdAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ROZ Invoices
CREATE TABLE IF NOT EXISTS roz_invoices (
  id serial PRIMARY KEY,
  "contractId" integer NOT NULL,
  "invoiceNumber" varchar(64) NOT NULL UNIQUE,
  "periodStart" bigint NOT NULL,
  "periodEnd" bigint NOT NULL,
  "rentCredits" decimal(12,2) NOT NULL,
  "serviceChargeCredits" decimal(10,2) DEFAULT 0.00,
  "indexationAdjustment" decimal(10,2) DEFAULT 0.00,
  "totalCredits" decimal(12,2) NOT NULL,
  "walletId" integer,
  "ledgerEntryId" integer,
  status text DEFAULT 'draft' NOT NULL,
  "dueDate" bigint NOT NULL,
  "paidDate" bigint,
  notes text,
  "createdAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_roz_pricing_resource ON roz_pricing_tiers ("resourceId");
CREATE INDEX IF NOT EXISTS idx_roz_pricing_location ON roz_pricing_tiers ("locationId");
CREATE INDEX IF NOT EXISTS idx_roz_contracts_resource ON roz_contracts ("resourceId");
CREATE INDEX IF NOT EXISTS idx_roz_contracts_location ON roz_contracts ("locationId");
CREATE INDEX IF NOT EXISTS idx_roz_contracts_status ON roz_contracts (status);
CREATE INDEX IF NOT EXISTS idx_roz_invoices_contract ON roz_invoices ("contractId");
CREATE INDEX IF NOT EXISTS idx_roz_invoices_status ON roz_invoices (status);
