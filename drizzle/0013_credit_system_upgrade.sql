-- Credit System Upgrade Migration
-- Enhances existing tables and adds credit packages, budget controls, commit contracts, credit bonuses

-- ─── Enhance credit_bundles ─────────────────────────────────────────
ALTER TABLE `credit_bundles`
  ADD COLUMN `targetAudience` ENUM('freelancer','individual','smb','business','corporate') DEFAULT NULL,
  ADD COLUMN `contractType` ENUM('monthly','semi_annual','annual','multi_year') DEFAULT NULL,
  ADD COLUMN `contractDurationMonths` INT DEFAULT NULL,
  ADD COLUMN `rolloverPercent` INT DEFAULT 0,
  ADD COLUMN `pricePerCredit` DECIMAL(8,4) DEFAULT NULL,
  ADD COLUMN `walletType` ENUM('personal','company','both') DEFAULT NULL,
  ADD COLUMN `budgetControlLevel` ENUM('none','basic','advanced','enterprise') DEFAULT 'none',
  ADD COLUMN `overageRate` DECIMAL(8,2) DEFAULT NULL,
  ADD COLUMN `minCommitMonths` INT DEFAULT NULL,
  ADD COLUMN `maxRolloverCredits` INT DEFAULT NULL;

-- ─── Enhance wallets ────────────────────────────────────────────────
ALTER TABLE `wallets`
  ADD COLUMN `walletContractType` ENUM('monthly','semi_annual','annual','multi_year') DEFAULT NULL,
  ADD COLUMN `contractStartDate` BIGINT DEFAULT NULL,
  ADD COLUMN `contractEndDate` BIGINT DEFAULT NULL,
  ADD COLUMN `rolloverPercent` INT DEFAULT 0,
  ADD COLUMN `spendingCapPerMonth` DECIMAL(12,2) DEFAULT NULL,
  ADD COLUMN `autoTopUpEnabled` TINYINT(1) DEFAULT 0,
  ADD COLUMN `autoTopUpThreshold` DECIMAL(12,2) DEFAULT NULL,
  ADD COLUMN `autoTopUpAmount` DECIMAL(12,2) DEFAULT NULL,
  ADD COLUMN `creditExpiresAt` BIGINT DEFAULT NULL,
  ADD COLUMN `permanentBalance` DECIMAL(12,2) DEFAULT '0.00',
  ADD COLUMN `monthlySpent` DECIMAL(12,2) DEFAULT '0.00';

-- ─── Enhance credit_ledger ──────────────────────────────────────────
ALTER TABLE `credit_ledger`
  MODIFY COLUMN `type` ENUM('grant','spend','rollover','breakage','topup','refund','transfer','package_purchase','overage','bonus','expiration') NOT NULL,
  ADD COLUMN `source` ENUM('subscription','package','topup','bonus','manual') DEFAULT NULL,
  ADD COLUMN `expiresAt` BIGINT DEFAULT NULL,
  ADD COLUMN `packageId` INT DEFAULT NULL;

-- ─── Enhance notifications ──────────────────────────────────────────
ALTER TABLE `notifications`
  MODIFY COLUMN `type` ENUM('enterprise_signup','breakage_milestone','occupancy_anomaly','credit_inflation','monthly_report','booking_reminder','visitor_arrival','system','credit_threshold_80','credit_threshold_100','credit_expired','auto_topup_triggered','budget_cap_reached','approval_required','commit_milestone','bonus_awarded','rollover_processed') NOT NULL;

-- ─── Credit Packages (Standalone Purchases) ─────────────────────────
CREATE TABLE `credit_packages` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(128) NOT NULL,
  `slug` VARCHAR(64) NOT NULL UNIQUE,
  `credits` INT NOT NULL,
  `priceEur` DECIMAL(10,2) NOT NULL,
  `pricePerCredit` DECIMAL(8,4) DEFAULT NULL,
  `discountPercent` DECIMAL(5,2) DEFAULT '0.00',
  `description` TEXT,
  `features` JSON,
  `minBundleTier` VARCHAR(64) DEFAULT NULL,
  `isActive` TINYINT(1) DEFAULT 1,
  `stripeProductId` VARCHAR(128) DEFAULT NULL,
  `stripePriceId` VARCHAR(128) DEFAULT NULL,
  `sortOrder` INT DEFAULT 0,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
);

-- ─── Budget Controls ────────────────────────────────────────────────
CREATE TABLE `budget_controls` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `companyId` INT NOT NULL,
  `walletId` INT DEFAULT NULL,
  `controlType` ENUM('per_employee_cap','team_budget','location_restriction','resource_type_restriction','approval_threshold') NOT NULL,
  `targetUserId` INT DEFAULT NULL,
  `targetTeam` VARCHAR(128) DEFAULT NULL,
  `capAmount` DECIMAL(12,2) DEFAULT NULL,
  `periodType` ENUM('daily','weekly','monthly') DEFAULT 'monthly',
  `allowedLocationIds` JSON,
  `allowedResourceTypes` JSON,
  `approvalThreshold` DECIMAL(12,2) DEFAULT NULL,
  `approverUserId` INT DEFAULT NULL,
  `currentSpend` DECIMAL(12,2) DEFAULT '0.00',
  `periodResetAt` BIGINT DEFAULT NULL,
  `isActive` TINYINT(1) DEFAULT 1,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
);

-- ─── Commit Contracts (Enterprise Agreements) ───────────────────────
CREATE TABLE `commit_contracts` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `companyId` INT NOT NULL,
  `walletId` INT DEFAULT NULL,
  `name` VARCHAR(256) NOT NULL,
  `totalCommitCredits` DECIMAL(14,2) NOT NULL,
  `totalCommitEur` DECIMAL(14,2) DEFAULT NULL,
  `commitPeriodMonths` INT NOT NULL,
  `startDate` BIGINT NOT NULL,
  `endDate` BIGINT NOT NULL,
  `prepaidAmount` DECIMAL(14,2) DEFAULT '0.00',
  `drawdownUsed` DECIMAL(14,2) DEFAULT '0.00',
  `monthlyAllocation` DECIMAL(12,2) DEFAULT NULL,
  `rampedCommitments` JSON,
  `discountPercent` DECIMAL(5,2) DEFAULT '0.00',
  `trueUpEnabled` TINYINT(1) DEFAULT 0,
  `trueUpDate` BIGINT DEFAULT NULL,
  `earlyRenewalBonus` DECIMAL(10,2) DEFAULT NULL,
  `commitStatus` ENUM('draft','pending_approval','active','paused','expired','terminated') DEFAULT 'draft' NOT NULL,
  `notes` TEXT,
  `commitStripeSubId` VARCHAR(128) DEFAULT NULL,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
);

-- ─── Credit Bonuses (Gamification & Loyalty) ────────────────────────
CREATE TABLE `credit_bonuses` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `bonusType` ENUM('signup_bonus','referral','renewal','daypass_conversion','loyalty','promotion','manual') NOT NULL,
  `walletId` INT DEFAULT NULL,
  `userId` INT DEFAULT NULL,
  `companyId` INT DEFAULT NULL,
  `amount` DECIMAL(12,2) NOT NULL,
  `description` TEXT,
  `referrerUserId` INT DEFAULT NULL,
  `referredCompanyId` INT DEFAULT NULL,
  `sourceContractId` INT DEFAULT NULL,
  `sourceBundleId` INT DEFAULT NULL,
  `bonusExpiresAt` BIGINT DEFAULT NULL,
  `isApplied` TINYINT(1) DEFAULT 0,
  `appliedAt` TIMESTAMP NULL DEFAULT NULL,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ─── Seed default credit packages ───────────────────────────────────
INSERT INTO `credit_packages` (`name`, `slug`, `credits`, `priceEur`, `pricePerCredit`, `discountPercent`, `description`, `sortOrder`) VALUES
  ('Starter', 'starter', 10, 25.00, 2.5000, 0.00, 'Perfect for occasional use', 1),
  ('Value', 'value', 50, 100.00, 2.0000, 20.00, 'Best for regular users', 2),
  ('Bulk', 'bulk', 200, 320.00, 1.6000, 36.00, 'Ideal for teams and frequent users', 3),
  ('Enterprise Top-Up', 'enterprise-topup', 1000, 1200.00, 1.2000, 52.00, 'Maximum savings for large organizations', 4);

-- ─── Seed tiered subscription plans ─────────────────────────────────
UPDATE `credit_bundles` SET `targetAudience` = 'freelancer', `contractType` = 'monthly', `rolloverPercent` = 0, `walletType` = 'personal', `budgetControlLevel` = 'none' WHERE `slug` = 'free' AND `targetAudience` IS NULL;
