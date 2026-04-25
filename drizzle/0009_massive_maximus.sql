CREATE TABLE `budget_controls` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int NOT NULL,
	`walletId` int,
	`controlType` enum('per_employee_cap','team_budget','location_restriction','resource_type_restriction','approval_threshold') NOT NULL,
	`targetUserId` int,
	`targetTeam` varchar(128),
	`capAmount` decimal(12,2),
	`periodType` enum('daily','weekly','monthly') DEFAULT 'monthly',
	`allowedLocationIds` json,
	`allowedResourceTypes` json,
	`approvalThreshold` decimal(12,2),
	`approverUserId` int,
	`currentSpend` decimal(12,2) DEFAULT '0.00',
	`periodResetAt` bigint,
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `budget_controls_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `commit_contracts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int NOT NULL,
	`walletId` int,
	`name` varchar(256) NOT NULL,
	`totalCommitCredits` decimal(14,2) NOT NULL,
	`totalCommitEur` decimal(14,2),
	`commitPeriodMonths` int NOT NULL,
	`startDate` bigint NOT NULL,
	`endDate` bigint NOT NULL,
	`prepaidAmount` decimal(14,2) DEFAULT '0.00',
	`drawdownUsed` decimal(14,2) DEFAULT '0.00',
	`monthlyAllocation` decimal(12,2),
	`rampedCommitments` json,
	`discountPercent` decimal(5,2) DEFAULT '0.00',
	`trueUpEnabled` boolean DEFAULT false,
	`trueUpDate` bigint,
	`earlyRenewalBonus` decimal(10,2),
	`commitStatus` enum('draft','pending_approval','active','paused','expired','terminated') NOT NULL DEFAULT 'draft',
	`notes` text,
	`commitStripeSubId` varchar(128),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `commit_contracts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `credit_bonuses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`bonusType` enum('signup_bonus','referral','renewal','daypass_conversion','loyalty','promotion','manual') NOT NULL,
	`walletId` int,
	`userId` int,
	`companyId` int,
	`amount` decimal(12,2) NOT NULL,
	`description` text,
	`referrerUserId` int,
	`referredCompanyId` int,
	`sourceContractId` int,
	`sourceBundleId` int,
	`bonusExpiresAt` bigint,
	`isApplied` boolean DEFAULT false,
	`appliedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `credit_bonuses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `credit_packages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(128) NOT NULL,
	`slug` varchar(64) NOT NULL,
	`credits` int NOT NULL,
	`priceEur` decimal(10,2) NOT NULL,
	`pricePerCredit` decimal(8,4),
	`discountPercent` decimal(5,2) DEFAULT '0.00',
	`description` text,
	`features` json,
	`minBundleTier` varchar(64),
	`isActive` boolean DEFAULT true,
	`stripeProductId` varchar(128),
	`stripePriceId` varchar(128),
	`sortOrder` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `credit_packages_id` PRIMARY KEY(`id`),
	CONSTRAINT `credit_packages_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `email_campaign_sends` (
	`id` int AUTO_INCREMENT NOT NULL,
	`campaignId` int NOT NULL,
	`leadId` int NOT NULL,
	`email` varchar(256) NOT NULL,
	`sendStatus` enum('queued','sent','opened','clicked','bounced','unsubscribed') NOT NULL DEFAULT 'queued',
	`sentAt` timestamp,
	`openedAt` timestamp,
	`clickedAt` timestamp,
	`bouncedAt` timestamp,
	`bounceReason` varchar(512),
	`resendMessageId` varchar(256),
	`clickCount` int DEFAULT 0,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `email_campaign_sends_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `escalation_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ticketId` int NOT NULL,
	`ruleId` int,
	`escalationLevel` int NOT NULL DEFAULT 1,
	`previousAssignee` int,
	`newAssignee` int,
	`previousPriority` varchar(32),
	`newPriority` varchar(32),
	`reason` text,
	`slaBreach` boolean DEFAULT false,
	`status` varchar(32) DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `escalation_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `escalation_rules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(256) NOT NULL,
	`description` text,
	`priority` varchar(32) DEFAULT 'normal',
	`category` varchar(64),
	`escalateAfterMinutes` int NOT NULL DEFAULT 60,
	`triggerType` varchar(64) NOT NULL DEFAULT 'no_response',
	`escalationLevel` int NOT NULL DEFAULT 1,
	`escalateToRole` varchar(32) DEFAULT 'host',
	`escalateToUserId` int,
	`notifyEmail` boolean DEFAULT true,
	`notifyInApp` boolean DEFAULT true,
	`autoReassign` boolean DEFAULT false,
	`autoPriorityBump` boolean DEFAULT false,
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp DEFAULT (now()),
	CONSTRAINT `escalation_rules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `gym_schedules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`locationId` int NOT NULL,
	`className` text NOT NULL,
	`instructor` text,
	`description` text,
	`category` enum('cardio','strength','yoga','pilates','hiit','cycling','boxing','stretching','meditation','egym') NOT NULL,
	`dayOfWeek` int NOT NULL,
	`startTime` varchar(10) NOT NULL,
	`endTime` varchar(10) NOT NULL,
	`maxParticipants` int DEFAULT 20,
	`currentParticipants` int DEFAULT 0,
	`imageUrl` text,
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `gym_schedules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `kitchen_menu_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`locationId` int NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`category` enum('breakfast','lunch','dinner','snack','drink','soup','salad','sandwich','special') NOT NULL,
	`price` text,
	`imageUrl` text,
	`allergens` json,
	`isVegan` boolean DEFAULT false,
	`isVegetarian` boolean DEFAULT false,
	`isGlutenFree` boolean DEFAULT false,
	`isAvailable` boolean DEFAULT true,
	`dayOfWeek` json,
	`sortOrder` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `kitchen_menu_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `menu_arrangements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`seasonId` int,
	`name` varchar(256) NOT NULL,
	`description` text,
	`priceEur` decimal(8,2) NOT NULL,
	`memberPriceEur` decimal(8,2),
	`isActive` boolean DEFAULT true,
	`sortOrder` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `menu_arrangements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `menu_categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(128) NOT NULL,
	`slug` varchar(64) NOT NULL,
	`icon` varchar(64),
	`sortOrder` int DEFAULT 0,
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `menu_categories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `menu_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`categoryId` int NOT NULL,
	`name` varchar(256) NOT NULL,
	`subtitle` varchar(512),
	`description` text,
	`priceEur` decimal(8,2),
	`priceLargeEur` decimal(8,2),
	`imageUrl` text,
	`allergens` json,
	`isVegan` boolean DEFAULT false,
	`isVegetarian` boolean DEFAULT false,
	`isGlutenFree` boolean DEFAULT false,
	`isSignature` boolean DEFAULT false,
	`isActive` boolean DEFAULT true,
	`sortOrder` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `menu_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `menu_preparations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`menuItemId` int NOT NULL,
	`seasonId` int,
	`steps` json NOT NULL,
	`ingredients` json,
	`prepTimeMinutes` int,
	`notes` text,
	`imageUrl` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `menu_preparations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `menu_season_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`seasonId` int NOT NULL,
	`menuItemId` int NOT NULL,
	`locationId` int,
	`priceOverrideEur` decimal(8,2),
	`priceLargeOverrideEur` decimal(8,2),
	`isAvailable` boolean DEFAULT true,
	`sortOrder` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `menu_season_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `menu_seasons` (
	`id` int AUTO_INCREMENT NOT NULL,
	`year` int NOT NULL,
	`quarter` enum('Q1','Q2','Q3','Q4') NOT NULL,
	`name` varchar(128) NOT NULL,
	`startDate` varchar(10) NOT NULL,
	`endDate` varchar(10) NOT NULL,
	`isActive` boolean DEFAULT false,
	`driveMenuSheetId` varchar(256),
	`driveFoodbookDocId` varchar(256),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `menu_seasons_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `parking_access_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`zoneId` int NOT NULL,
	`direction` text NOT NULL,
	`method` text NOT NULL,
	`licensePlate` varchar(20),
	`qrToken` varchar(128),
	`userId` int,
	`permitId` int,
	`poolId` int,
	`granted` boolean NOT NULL DEFAULT false,
	`denialReason` varchar(256),
	`sessionId` int,
	`responseTimeMs` int,
	`timestamp` bigint NOT NULL,
	CONSTRAINT `parking_access_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `parking_capacity_snapshots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`zoneId` int NOT NULL,
	`timestamp` bigint NOT NULL,
	`totalSpots` int NOT NULL,
	`occupied` int NOT NULL,
	`reserved` int DEFAULT 0,
	`poolGuaranteed` int DEFAULT 0,
	`poolOverflow` int DEFAULT 0,
	`payPerUse` int DEFAULT 0,
	`visitors` int DEFAULT 0,
	`occupancyPercent` decimal(5,2) NOT NULL,
	`predictedPeak` decimal(5,2),
	`overbookingHeadroom` int DEFAULT 0,
	CONSTRAINT `parking_capacity_snapshots_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `parking_pool_members` (
	`id` int AUTO_INCREMENT NOT NULL,
	`poolId` int NOT NULL,
	`userId` int NOT NULL,
	`licensePlate` varchar(20),
	`licensePlate2` varchar(20),
	`role` text DEFAULT ('member'),
	`status` text DEFAULT ('active'),
	`joinedAt` timestamp NOT NULL DEFAULT (now()),
	`totalSessions` int DEFAULT 0,
	`totalOverflowSessions` int DEFAULT 0,
	`noShowCount` int DEFAULT 0,
	CONSTRAINT `parking_pool_members_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `parking_pools` (
	`id` int AUTO_INCREMENT NOT NULL,
	`zoneId` int NOT NULL,
	`companyId` int,
	`name` varchar(128) NOT NULL,
	`guaranteedSpots` int NOT NULL DEFAULT 30,
	`maxMembers` int DEFAULT 0,
	`overflowPriceEur` decimal(8,2) DEFAULT '2.50',
	`overflowPriceDay` decimal(8,2) DEFAULT '15.00',
	`monthlyFeeEur` decimal(10,2) DEFAULT '0',
	`slaTier` text DEFAULT ('gold'),
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `parking_pools_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `parking_sla_violations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`zoneId` int NOT NULL,
	`userId` int NOT NULL,
	`permitId` int,
	`poolId` int,
	`slaTier` text NOT NULL,
	`violationType` text NOT NULL,
	`compensationEur` decimal(8,2) DEFAULT '0',
	`compensationCredits` decimal(8,2) DEFAULT '0',
	`compensationStatus` text DEFAULT ('pending'),
	`alternativeOffered` varchar(256),
	`timestamp` bigint NOT NULL,
	`resolvedAt` bigint,
	`notes` text,
	CONSTRAINT `parking_sla_violations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `parking_visitor_permits` (
	`id` int AUTO_INCREMENT NOT NULL,
	`zoneId` int NOT NULL,
	`invitedByUserId` int NOT NULL,
	`visitorName` varchar(256) NOT NULL,
	`visitorEmail` varchar(320),
	`visitorPhone` varchar(20),
	`licensePlate` varchar(20),
	`qrToken` varchar(128) NOT NULL,
	`validFrom` bigint NOT NULL,
	`validUntil` bigint NOT NULL,
	`maxEntries` int DEFAULT 1,
	`usedEntries` int DEFAULT 0,
	`status` text DEFAULT ('active'),
	`shareMethod` text,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `parking_visitor_permits_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `roz_contracts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`contractNumber` varchar(64) NOT NULL,
	`resourceId` int NOT NULL,
	`locationId` int NOT NULL,
	`userId` int,
	`companyId` int,
	`walletId` int,
	`pricingTierId` int,
	`periodType` enum('month','6_months','1_year','2_year','3_year','5_year','10_year') NOT NULL,
	`startDate` bigint NOT NULL,
	`endDate` bigint NOT NULL,
	`monthlyRentCredits` decimal(12,2) NOT NULL,
	`monthlyServiceCharge` decimal(10,2) DEFAULT '0.00',
	`depositAmount` decimal(12,2) DEFAULT '0.00',
	`depositPaid` boolean DEFAULT false,
	`indexationMethod` varchar(32) DEFAULT 'CPI',
	`indexationPct` decimal(5,2) DEFAULT '2.50',
	`lastIndexationDate` bigint,
	`nextIndexationDate` bigint,
	`noticePeriodMonths` int DEFAULT 3,
	`noticeGivenDate` bigint,
	`rozTemplateVersion` varchar(32) DEFAULT '2024',
	`rozDocumentUrl` text,
	`status` enum('draft','pending_signature','active','notice_given','expired','terminated') NOT NULL DEFAULT 'draft',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `roz_contracts_id` PRIMARY KEY(`id`),
	CONSTRAINT `roz_contracts_contractNumber_unique` UNIQUE(`contractNumber`)
);
--> statement-breakpoint
CREATE TABLE `roz_invoices` (
	`id` int AUTO_INCREMENT NOT NULL,
	`contractId` int NOT NULL,
	`invoiceNumber` varchar(64) NOT NULL,
	`periodStart` bigint NOT NULL,
	`periodEnd` bigint NOT NULL,
	`rentCredits` decimal(12,2) NOT NULL,
	`serviceChargeCredits` decimal(10,2) DEFAULT '0.00',
	`indexationAdjustment` decimal(10,2) DEFAULT '0.00',
	`totalCredits` decimal(12,2) NOT NULL,
	`walletId` int,
	`ledgerEntryId` int,
	`status` enum('draft','sent','paid','overdue','cancelled') NOT NULL DEFAULT 'draft',
	`dueDate` bigint NOT NULL,
	`paidDate` bigint,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `roz_invoices_id` PRIMARY KEY(`id`),
	CONSTRAINT `roz_invoices_invoiceNumber_unique` UNIQUE(`invoiceNumber`)
);
--> statement-breakpoint
CREATE TABLE `roz_pricing_tiers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`resourceId` int,
	`resourceTypeId` int,
	`locationId` int,
	`name` varchar(128) NOT NULL,
	`periodType` enum('month','6_months','1_year','2_year','3_year','5_year','10_year') NOT NULL,
	`periodMonths` int NOT NULL,
	`creditCostPerMonth` decimal(12,2) NOT NULL,
	`creditCostPerM2PerMonth` decimal(10,2),
	`discountPercent` decimal(5,2) DEFAULT '0.00',
	`serviceChargePerMonth` decimal(10,2) DEFAULT '0.00',
	`depositMonths` int DEFAULT 3,
	`isActive` boolean DEFAULT true,
	`sortOrder` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `roz_pricing_tiers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `signage_audit_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`screenId` int,
	`action` enum('provisioned','content_changed','playlist_assigned','screen_online','screen_offline','settings_changed','error_reported','reboot','firmware_update') NOT NULL,
	`description` text,
	`userId` int,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `signage_audit_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `signage_content` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` text NOT NULL,
	`contentType` enum('image','video','pdf','html','url','menu_card','wayfinding','gym_schedule','weather','clock','news_ticker','company_presence','welcome_screen','announcement') NOT NULL,
	`mediaUrl` text,
	`htmlContent` text,
	`externalUrl` text,
	`duration` int DEFAULT 15,
	`templateData` json,
	`targetScreenTypes` json,
	`locationId` int,
	`isActive` boolean DEFAULT true,
	`validFrom` timestamp,
	`validUntil` timestamp,
	`priority` int DEFAULT 0,
	`createdByUserId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `signage_content_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `signage_heartbeats` (
	`id` int AUTO_INCREMENT NOT NULL,
	`screenId` int NOT NULL,
	`status` enum('online','offline','provisioning','maintenance','error') DEFAULT 'online',
	`currentContentId` int,
	`currentPlaylistId` int,
	`cpuUsage` text,
	`memoryUsage` text,
	`temperature` text,
	`uptime` int,
	`errorMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `signage_heartbeats_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `signage_playlist_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`playlistId` int NOT NULL,
	`contentId` int NOT NULL,
	`sortOrder` int DEFAULT 0,
	`durationOverride` int,
	`isActive` boolean DEFAULT true,
	CONSTRAINT `signage_playlist_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `signage_playlists` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`screenType` enum('reception','gym','kitchen','wayfinding','general','meeting_room','elevator','parking'),
	`locationId` int,
	`isDefault` boolean DEFAULT false,
	`isActive` boolean DEFAULT true,
	`scheduleType` enum('always','time_based','day_based') DEFAULT 'always',
	`scheduleConfig` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `signage_playlists_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `signage_provisioning_templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` text NOT NULL,
	`screenType` enum('reception','gym','kitchen','wayfinding','general','meeting_room','elevator','parking') NOT NULL,
	`defaultPlaylistId` int,
	`defaultOrientation` enum('portrait','landscape') DEFAULT 'portrait',
	`defaultResolution` text,
	`defaultBrightness` int DEFAULT 100,
	`autoAssignLocation` boolean DEFAULT true,
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `signage_provisioning_templates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `signage_screen_group_members` (
	`id` int AUTO_INCREMENT NOT NULL,
	`screenId` int NOT NULL,
	`groupId` int NOT NULL,
	CONSTRAINT `signage_screen_group_members_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `signage_screen_groups` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`locationId` int,
	`screenType` enum('reception','gym','kitchen','wayfinding','general','meeting_room','elevator','parking'),
	`color` text,
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `signage_screen_groups_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `signage_screens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`locationId` int NOT NULL,
	`name` text NOT NULL,
	`screenType` enum('reception','gym','kitchen','wayfinding','general','meeting_room','elevator','parking') NOT NULL,
	`orientation` enum('portrait','landscape') DEFAULT 'portrait',
	`resolution` text,
	`floor` text,
	`zone` text,
	`provisioningToken` varchar(64),
	`status` enum('online','offline','provisioning','maintenance','error') DEFAULT 'provisioning',
	`lastHeartbeat` timestamp,
	`currentPlaylistId` int,
	`ipAddress` text,
	`macAddress` text,
	`userAgent` text,
	`firmwareVersion` text,
	`brightness` int DEFAULT 100,
	`volume` int DEFAULT 0,
	`isActive` boolean DEFAULT true,
	`tags` json,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `signage_screens_id` PRIMARY KEY(`id`),
	CONSTRAINT `signage_screens_provisioningToken_unique` UNIQUE(`provisioningToken`)
);
--> statement-breakpoint
CREATE TABLE `wallet_transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`walletId` int NOT NULL,
	`bundleId` int,
	`amount` decimal(12,2) NOT NULL,
	`creditsAdded` decimal(12,2) NOT NULL,
	`transactionType` enum('topup','spend','refund') NOT NULL,
	`stripeSessionId` varchar(128),
	`stripePaymentIntentId` varchar(128),
	`description` text,
	`transactionStatus` enum('pending','completed','failed','refunded') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `wallet_transactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `wayfinding_buildings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`locationId` int NOT NULL,
	`name` text NOT NULL,
	`code` text,
	`address` text,
	`floors` int DEFAULT 1,
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `wayfinding_buildings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `wayfinding_company_assignments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int NOT NULL,
	`buildingId` int NOT NULL,
	`floor` text,
	`roomNumber` text,
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `wayfinding_company_assignments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `wayfinding_company_presence` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int NOT NULL,
	`locationId` int NOT NULL,
	`buildingId` int,
	`isPresent` boolean DEFAULT false,
	`checkedInAt` timestamp,
	`checkedOutAt` timestamp,
	`checkedInByUserId` int,
	`method` enum('manual','access_log','auto','api') DEFAULT 'manual',
	`date` varchar(20) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `wayfinding_company_presence_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `website_visitors` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ip` varchar(45) NOT NULL,
	`companyName` varchar(256),
	`companyDomain` varchar(256),
	`city` varchar(128),
	`country` varchar(64),
	`pageUrl` text NOT NULL,
	`referrer` text,
	`userAgent` text,
	`leadId` int,
	`visitedAt` bigint NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `website_visitors_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `company_branding` MODIFY COLUMN `accentColor` varchar(9) DEFAULT '#C4B89E';--> statement-breakpoint
ALTER TABLE `company_branding` MODIFY COLUMN `fontFamily` varchar(128) DEFAULT 'Inter';--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('administrator','ceo','cfo','host','company_owner','teamadmin','member','facility','cleaner','guest') NOT NULL DEFAULT 'member';--> statement-breakpoint
ALTER TABLE `credit_bundles` ADD `targetAudience` enum('freelancer','individual','smb','business','corporate');--> statement-breakpoint
ALTER TABLE `credit_bundles` ADD `contractType` enum('monthly','semi_annual','annual','multi_year');--> statement-breakpoint
ALTER TABLE `credit_bundles` ADD `contractDurationMonths` int;--> statement-breakpoint
ALTER TABLE `credit_bundles` ADD `rolloverPercent` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `credit_bundles` ADD `pricePerCredit` decimal(8,4);--> statement-breakpoint
ALTER TABLE `credit_bundles` ADD `walletType` enum('personal','company','both');--> statement-breakpoint
ALTER TABLE `credit_bundles` ADD `budgetControlLevel` enum('none','basic','advanced','enterprise') DEFAULT 'none';--> statement-breakpoint
ALTER TABLE `credit_bundles` ADD `overageRate` decimal(8,2);--> statement-breakpoint
ALTER TABLE `credit_bundles` ADD `minCommitMonths` int;--> statement-breakpoint
ALTER TABLE `credit_bundles` ADD `maxRolloverCredits` int;--> statement-breakpoint
ALTER TABLE `credit_ledger` ADD `source` enum('subscription','package','topup','bonus','manual');--> statement-breakpoint
ALTER TABLE `credit_ledger` ADD `expiresAt` bigint;--> statement-breakpoint
ALTER TABLE `credit_ledger` ADD `packageId` int;--> statement-breakpoint
ALTER TABLE `kiosk_orders` ADD `kitchenStatus` enum('new','preparing','ready','picked_up') DEFAULT 'new';--> statement-breakpoint
ALTER TABLE `kiosk_orders` ADD `kitchenStartedAt` timestamp;--> statement-breakpoint
ALTER TABLE `kiosk_orders` ADD `kitchenReadyAt` timestamp;--> statement-breakpoint
ALTER TABLE `kiosk_orders` ADD `kitchenPickedUpAt` timestamp;--> statement-breakpoint
ALTER TABLE `parking_permits` ADD `poolId` int;--> statement-breakpoint
ALTER TABLE `parking_permits` ADD `slaTier` text DEFAULT ('silver');--> statement-breakpoint
ALTER TABLE `parking_permits` ADD `noShowCount` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `parking_permits` ADD `penaltyPoints` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `parking_sessions` ADD `poolId` int;--> statement-breakpoint
ALTER TABLE `parking_sessions` ADD `entryMethod` text DEFAULT ('anpr');--> statement-breakpoint
ALTER TABLE `parking_sessions` ADD `accessType` text DEFAULT ('member');--> statement-breakpoint
ALTER TABLE `parking_zones` ADD `reservedSpots` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `parking_zones` ADD `overbookingEnabled` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `parking_zones` ADD `overbookingRatio` decimal(4,2) DEFAULT '1.20';--> statement-breakpoint
ALTER TABLE `parking_zones` ADD `noShowRateAvg` decimal(4,2) DEFAULT '0.25';--> statement-breakpoint
ALTER TABLE `parking_zones` ADD `costUnderbooking` decimal(8,2) DEFAULT '75.00';--> statement-breakpoint
ALTER TABLE `parking_zones` ADD `costOverbooking` decimal(8,2) DEFAULT '50.00';--> statement-breakpoint
ALTER TABLE `parking_zones` ADD `payPerUseEnabled` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `parking_zones` ADD `payPerUseThreshold` int DEFAULT 85;--> statement-breakpoint
ALTER TABLE `resources` ADD `areaM2` decimal(8,2);--> statement-breakpoint
ALTER TABLE `resources` ADD `isRozEligible` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `resources` ADD `rozContractType` varchar(64);--> statement-breakpoint
ALTER TABLE `resources` ADD `rozServiceChargeModel` varchar(64) DEFAULT 'voorschot';--> statement-breakpoint
ALTER TABLE `resources` ADD `rozVatRate` decimal(5,2) DEFAULT '21.00';--> statement-breakpoint
ALTER TABLE `resources` ADD `rozIndexation` varchar(32) DEFAULT 'CPI';--> statement-breakpoint
ALTER TABLE `resources` ADD `rozIndexationPct` decimal(5,2) DEFAULT '2.50';--> statement-breakpoint
ALTER TABLE `resources` ADD `rozTenantProtection` boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE `resources` ADD `rozMinLeaseTerm` int DEFAULT 1;--> statement-breakpoint
ALTER TABLE `resources` ADD `rozNoticePeriodMonths` int DEFAULT 3;--> statement-breakpoint
ALTER TABLE `users` ADD `qrToken` varchar(128);--> statement-breakpoint
ALTER TABLE `wallets` ADD `walletContractType` enum('monthly','semi_annual','annual','multi_year');--> statement-breakpoint
ALTER TABLE `wallets` ADD `contractStartDate` bigint;--> statement-breakpoint
ALTER TABLE `wallets` ADD `contractEndDate` bigint;--> statement-breakpoint
ALTER TABLE `wallets` ADD `rolloverPercent` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `wallets` ADD `spendingCapPerMonth` decimal(12,2);--> statement-breakpoint
ALTER TABLE `wallets` ADD `autoTopUpEnabled` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `wallets` ADD `autoTopUpThreshold` decimal(12,2);--> statement-breakpoint
ALTER TABLE `wallets` ADD `autoTopUpAmount` decimal(12,2);--> statement-breakpoint
ALTER TABLE `wallets` ADD `creditExpiresAt` bigint;--> statement-breakpoint
ALTER TABLE `wallets` ADD `permanentBalance` decimal(12,2) DEFAULT '0.00';--> statement-breakpoint
ALTER TABLE `wallets` ADD `monthlySpent` decimal(12,2) DEFAULT '0.00';--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_qrToken_unique` UNIQUE(`qrToken`);