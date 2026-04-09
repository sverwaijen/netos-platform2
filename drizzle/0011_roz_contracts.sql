-- ROZ Huurovereenkomsten Module
-- Adds ROZ (Raad voor Onroerende Zaken) commercial lease support

-- Add ROZ-specific fields to resources table
ALTER TABLE `resources`
  ADD COLUMN `areaM2` DECIMAL(8,2) DEFAULT NULL COMMENT 'Floor area in square meters',
  ADD COLUMN `isRozEligible` BOOLEAN DEFAULT FALSE COMMENT 'Auto-set TRUE when areaM2 >= 100',
  ADD COLUMN `rozContractType` VARCHAR(64) DEFAULT NULL COMMENT 'ROZ template: kantoorruimte, winkelruimte, bedrijfsruimte',
  ADD COLUMN `rozServiceChargeModel` VARCHAR(64) DEFAULT 'voorschot' COMMENT 'voorschot (advance) or nacalculatie (actual)',
  ADD COLUMN `rozVatRate` DECIMAL(5,2) DEFAULT '21.00' COMMENT 'BTW percentage',
  ADD COLUMN `rozIndexation` VARCHAR(32) DEFAULT 'CPI' COMMENT 'Indexation method: CPI, fixed_pct, none',
  ADD COLUMN `rozIndexationPct` DECIMAL(5,2) DEFAULT '2.50' COMMENT 'Fixed indexation % if applicable',
  ADD COLUMN `rozTenantProtection` BOOLEAN DEFAULT TRUE COMMENT 'Huurbescherming enabled',
  ADD COLUMN `rozMinLeaseTerm` INT DEFAULT 1 COMMENT 'Minimum lease term in months',
  ADD COLUMN `rozNoticePeriodMonths` INT DEFAULT 3 COMMENT 'Opzegtermijn in maanden';

-- ROZ Lease Pricing Tiers (staffelprijzen per looptijd)
CREATE TABLE `roz_pricing_tiers` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `resourceId` INT DEFAULT NULL COMMENT 'Specific resource, NULL = template',
  `resourceTypeId` INT DEFAULT NULL COMMENT 'Apply to all of this type',
  `locationId` INT DEFAULT NULL COMMENT 'Location scope',
  `name` VARCHAR(128) NOT NULL,
  `periodType` ENUM('month', '6_months', '1_year', '2_year', '3_year', '5_year', '10_year') NOT NULL,
  `periodMonths` INT NOT NULL COMMENT 'Duration in months: 1,6,12,24,36,60,120',
  `creditCostPerMonth` DECIMAL(12,2) NOT NULL COMMENT 'Monthly credit cost for this tier',
  `creditCostPerM2PerMonth` DECIMAL(10,2) DEFAULT NULL COMMENT 'Per m² per month rate',
  `discountPercent` DECIMAL(5,2) DEFAULT '0.00' COMMENT 'Discount vs base rate',
  `serviceChargePerMonth` DECIMAL(10,2) DEFAULT '0.00' COMMENT 'Servicekosten per maand',
  `depositMonths` INT DEFAULT 3 COMMENT 'Waarborgsom in maanden huur',
  `isActive` BOOLEAN DEFAULT TRUE,
  `sortOrder` INT DEFAULT 0,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
);

-- ROZ Lease Contracts (actieve huurovereenkomsten)
CREATE TABLE `roz_contracts` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `contractNumber` VARCHAR(64) NOT NULL UNIQUE,
  `resourceId` INT NOT NULL,
  `locationId` INT NOT NULL,
  `userId` INT DEFAULT NULL COMMENT 'Tenant user',
  `companyId` INT DEFAULT NULL COMMENT 'Tenant company',
  `walletId` INT DEFAULT NULL COMMENT 'Linked wallet for credit billing',
  `pricingTierId` INT DEFAULT NULL,
  `periodType` ENUM('month', '6_months', '1_year', '2_year', '3_year', '5_year', '10_year') NOT NULL,
  `startDate` BIGINT NOT NULL COMMENT 'Lease start epoch ms',
  `endDate` BIGINT NOT NULL COMMENT 'Lease end epoch ms',
  `monthlyRentCredits` DECIMAL(12,2) NOT NULL COMMENT 'Maandelijkse huur in credits',
  `monthlyServiceCharge` DECIMAL(10,2) DEFAULT '0.00' COMMENT 'Servicekosten per maand',
  `depositAmount` DECIMAL(12,2) DEFAULT '0.00' COMMENT 'Waarborgsom in credits',
  `depositPaid` BOOLEAN DEFAULT FALSE,
  `indexationMethod` VARCHAR(32) DEFAULT 'CPI',
  `indexationPct` DECIMAL(5,2) DEFAULT '2.50',
  `lastIndexationDate` BIGINT DEFAULT NULL,
  `nextIndexationDate` BIGINT DEFAULT NULL,
  `noticePeriodMonths` INT DEFAULT 3,
  `noticeGivenDate` BIGINT DEFAULT NULL,
  `rozTemplateVersion` VARCHAR(32) DEFAULT '2024',
  `rozDocumentUrl` TEXT DEFAULT NULL COMMENT 'URL to signed ROZ document',
  `status` ENUM('draft', 'pending_signature', 'active', 'notice_given', 'expired', 'terminated') DEFAULT 'draft' NOT NULL,
  `notes` TEXT DEFAULT NULL,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
);

-- ROZ Invoice Records (maandelijkse facturatie)
CREATE TABLE `roz_invoices` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `contractId` INT NOT NULL,
  `invoiceNumber` VARCHAR(64) NOT NULL UNIQUE,
  `periodStart` BIGINT NOT NULL,
  `periodEnd` BIGINT NOT NULL,
  `rentCredits` DECIMAL(12,2) NOT NULL,
  `serviceChargeCredits` DECIMAL(10,2) DEFAULT '0.00',
  `indexationAdjustment` DECIMAL(10,2) DEFAULT '0.00',
  `totalCredits` DECIMAL(12,2) NOT NULL,
  `walletId` INT DEFAULT NULL,
  `ledgerEntryId` INT DEFAULT NULL COMMENT 'Reference to credit_ledger entry',
  `status` ENUM('draft', 'sent', 'paid', 'overdue', 'cancelled') DEFAULT 'draft' NOT NULL,
  `dueDate` BIGINT NOT NULL,
  `paidDate` BIGINT DEFAULT NULL,
  `notes` TEXT DEFAULT NULL,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
);
