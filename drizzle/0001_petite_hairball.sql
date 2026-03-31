CREATE TABLE `access_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`resourceId` int,
	`locationId` int NOT NULL,
	`zone` enum('zone_0','zone_1','zone_2','zone_3'),
	`action` enum('entry','exit','denied','key_provisioned') NOT NULL,
	`method` enum('ble','nfc','qr','manual'),
	`saltoEventId` varchar(128),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `access_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `bookings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`resourceId` int NOT NULL,
	`locationId` int NOT NULL,
	`walletId` int,
	`startTime` bigint NOT NULL,
	`endTime` bigint NOT NULL,
	`creditsCost` decimal(10,2) NOT NULL,
	`multiplierApplied` decimal(4,2) DEFAULT '1.00',
	`status` enum('confirmed','checked_in','completed','cancelled','no_show') NOT NULL DEFAULT 'confirmed',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `bookings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `companies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(256) NOT NULL,
	`slug` varchar(128) NOT NULL,
	`logoUrl` text,
	`primaryColor` varchar(7) DEFAULT '#1a1a2e',
	`secondaryColor` varchar(7) DEFAULT '#e94560',
	`memberCount` int DEFAULT 0,
	`tier` enum('bronze','silver','gold') DEFAULT 'bronze',
	`totalSpend` decimal(12,2) DEFAULT '0',
	`discountPercent` decimal(5,2) DEFAULT '5',
	`isActive` boolean DEFAULT true,
	`auth0OrgId` varchar(128),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `companies_id` PRIMARY KEY(`id`),
	CONSTRAINT `companies_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `company_branding` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int NOT NULL,
	`logoUrl` text,
	`primaryColor` varchar(7) DEFAULT '#1a1a2e',
	`secondaryColor` varchar(7) DEFAULT '#e94560',
	`welcomeMessage` text,
	`backgroundImageUrl` text,
	`isActive` boolean DEFAULT true,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `company_branding_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `credit_bundles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(128) NOT NULL,
	`slug` varchar(64) NOT NULL,
	`creditsPerMonth` int NOT NULL,
	`priceEur` decimal(10,2) NOT NULL,
	`description` text,
	`features` json,
	`isPopular` boolean DEFAULT false,
	`isActive` boolean DEFAULT true,
	`stripeProductId` varchar(128),
	`stripePriceId` varchar(128),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `credit_bundles_id` PRIMARY KEY(`id`),
	CONSTRAINT `credit_bundles_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `credit_ledger` (
	`id` int AUTO_INCREMENT NOT NULL,
	`walletId` int NOT NULL,
	`type` enum('grant','spend','rollover','breakage','topup','refund','transfer') NOT NULL,
	`amount` decimal(12,2) NOT NULL,
	`balanceAfter` decimal(12,2) NOT NULL,
	`description` text,
	`referenceType` varchar(64),
	`referenceId` int,
	`multiplier` decimal(4,2),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `credit_ledger_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `day_multipliers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`locationId` int NOT NULL,
	`dayOfWeek` int NOT NULL,
	`multiplier` decimal(4,2) NOT NULL,
	`isActive` boolean DEFAULT true,
	CONSTRAINT `day_multipliers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `devices` (
	`id` int AUTO_INCREMENT NOT NULL,
	`locationId` int NOT NULL,
	`name` varchar(128) NOT NULL,
	`type` enum('netlink','display','sensor_hub','door_controller') NOT NULL,
	`serialNumber` varchar(128),
	`status` enum('online','offline','maintenance') DEFAULT 'online',
	`lastPing` timestamp,
	`firmwareVersion` varchar(32),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `devices_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `employee_photos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`companyId` int NOT NULL,
	`photoUrl` text NOT NULL,
	`displayName` varchar(128),
	`jobTitle` varchar(128),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `employee_photos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `invites` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320),
	`phone` varchar(20),
	`companyId` int,
	`invitedByUserId` int,
	`role` enum('admin','user','guest') DEFAULT 'user',
	`token` varchar(128) NOT NULL,
	`status` enum('pending','accepted','expired') DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`expiresAt` timestamp,
	CONSTRAINT `invites_id` PRIMARY KEY(`id`),
	CONSTRAINT `invites_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
CREATE TABLE `locations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(128) NOT NULL,
	`slug` varchar(64) NOT NULL,
	`address` text NOT NULL,
	`city` varchar(64) NOT NULL,
	`postalCode` varchar(12),
	`lat` decimal(10,6),
	`lng` decimal(10,6),
	`imageUrl` text,
	`totalResources` int DEFAULT 0,
	`isActive` boolean DEFAULT true,
	`timezone` varchar(64) DEFAULT 'Europe/Amsterdam',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `locations_id` PRIMARY KEY(`id`),
	CONSTRAINT `locations_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`type` enum('enterprise_signup','breakage_milestone','occupancy_anomaly','credit_inflation','monthly_report','booking_reminder','visitor_arrival','system') NOT NULL,
	`title` varchar(256) NOT NULL,
	`message` text,
	`isRead` boolean DEFAULT false,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `resources` (
	`id` int AUTO_INCREMENT NOT NULL,
	`locationId` int NOT NULL,
	`name` varchar(128) NOT NULL,
	`type` enum('desk','meeting_room','private_office','open_space','locker','gym','phone_booth','event_space') NOT NULL,
	`zone` enum('zone_0','zone_1','zone_2','zone_3') NOT NULL,
	`capacity` int DEFAULT 1,
	`floor` varchar(16),
	`amenities` json,
	`creditCostPerHour` decimal(8,2) NOT NULL,
	`imageUrl` text,
	`isActive` boolean DEFAULT true,
	`mapX` decimal(6,2),
	`mapY` decimal(6,2),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `resources_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sensors` (
	`id` int AUTO_INCREMENT NOT NULL,
	`deviceId` int NOT NULL,
	`resourceId` int,
	`type` enum('occupancy','temperature','humidity','co2','light','motion') NOT NULL,
	`currentValue` decimal(10,2),
	`unit` varchar(16),
	`lastReading` timestamp,
	`isActive` boolean DEFAULT true,
	CONSTRAINT `sensors_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `visitors` (
	`id` int AUTO_INCREMENT NOT NULL,
	`invitedByUserId` int NOT NULL,
	`companyId` int,
	`name` varchar(256) NOT NULL,
	`email` varchar(320),
	`phone` varchar(20),
	`licensePlate` varchar(20),
	`visitDate` bigint NOT NULL,
	`locationId` int NOT NULL,
	`status` enum('invited','checked_in','checked_out','cancelled') NOT NULL DEFAULT 'invited',
	`accessToken` varchar(128),
	`deepLinkSent` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `visitors_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `wallets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`type` enum('company','personal') NOT NULL,
	`ownerId` int NOT NULL,
	`balance` decimal(12,2) NOT NULL DEFAULT '0',
	`rolloverBalance` decimal(12,2) DEFAULT '0',
	`bundleId` int,
	`maxRollover` int DEFAULT 0,
	`stripeCustomerId` varchar(128),
	`stripeSubscriptionId` varchar(128),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `wallets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('admin','user','guest') NOT NULL DEFAULT 'user';--> statement-breakpoint
ALTER TABLE `users` ADD `phone` varchar(20);--> statement-breakpoint
ALTER TABLE `users` ADD `avatarUrl` text;--> statement-breakpoint
ALTER TABLE `users` ADD `companyId` int;--> statement-breakpoint
ALTER TABLE `users` ADD `invitedBy` int;--> statement-breakpoint
ALTER TABLE `users` ADD `onboardingComplete` boolean DEFAULT false;