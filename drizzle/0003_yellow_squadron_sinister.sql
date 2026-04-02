CREATE TABLE `booking_policies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(128) NOT NULL,
	`locationId` int,
	`resourceTypeId` int,
	`bufferMinutes` int DEFAULT 0,
	`minAdvanceMinutes` int DEFAULT 0,
	`maxAdvanceDays` int DEFAULT 90,
	`minDurationMinutes` int DEFAULT 15,
	`maxDurationMinutes` int DEFAULT 480,
	`freeCancelMinutes` int DEFAULT 1440,
	`lateCancelFeePercent` int DEFAULT 50,
	`noShowFeePercent` int DEFAULT 100,
	`autoCheckInMinutes` int DEFAULT 15,
	`autoCancelNoCheckIn` boolean DEFAULT true,
	`allowRecurring` boolean DEFAULT true,
	`requireApproval` boolean DEFAULT false,
	`allowGuestBooking` boolean DEFAULT false,
	`maxAttendeesOverride` int,
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `booking_policies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `resource_amenities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(128) NOT NULL,
	`icon` varchar(64),
	`category` enum('tech','furniture','comfort','accessibility','catering') DEFAULT 'tech',
	`isActive` boolean DEFAULT true,
	CONSTRAINT `resource_amenities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `resource_amenity_map` (
	`id` int AUTO_INCREMENT NOT NULL,
	`resourceId` int NOT NULL,
	`amenityId` int NOT NULL,
	CONSTRAINT `resource_amenity_map_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `resource_blocked_dates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`resourceId` int,
	`locationId` int,
	`startDate` bigint NOT NULL,
	`endDate` bigint NOT NULL,
	`reason` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `resource_blocked_dates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `resource_categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(128) NOT NULL,
	`slug` varchar(64) NOT NULL,
	`description` text,
	`icon` varchar(64),
	`sortOrder` int DEFAULT 0,
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `resource_categories_id` PRIMARY KEY(`id`),
	CONSTRAINT `resource_categories_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `resource_rates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(128) NOT NULL,
	`resourceTypeId` int NOT NULL,
	`creditCost` decimal(10,2) NOT NULL,
	`chargingUnit` enum('per_hour','per_day','per_use','per_week','per_month') NOT NULL DEFAULT 'per_hour',
	`maxPriceCap` decimal(10,2),
	`initialFixedCost` decimal(10,2),
	`initialFixedMinutes` int,
	`perAttendeePricing` boolean DEFAULT false,
	`isDefault` boolean DEFAULT false,
	`appliesToCustomerType` enum('all','members_only','guests_only','specific_plans','specific_tiers') DEFAULT 'all',
	`appliesToTiers` json,
	`appliesToBundleIds` json,
	`creditCostInCredits` int,
	`validDaysOfWeek` json,
	`validTimeStart` varchar(5),
	`validTimeEnd` varchar(5),
	`validFromDate` bigint,
	`validToDate` bigint,
	`maxBookingLengthMinutes` int,
	`isActive` boolean DEFAULT true,
	`sortOrder` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `resource_rates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `resource_rules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(256) NOT NULL,
	`description` text,
	`scope` enum('global','individual') NOT NULL DEFAULT 'individual',
	`resourceId` int,
	`resourceTypeId` int,
	`conditionType` enum('customer_type','plan_type','tier_type','time_of_day','day_of_week','advance_booking','booking_length','zone_access') NOT NULL,
	`conditionValue` json,
	`limitType` enum('block_booking','restrict_hours','max_duration','min_duration','max_advance_days','min_advance_hours','max_bookings_per_day','max_bookings_per_week','require_approval') NOT NULL,
	`limitValue` json,
	`evaluationOrder` int DEFAULT 0,
	`stopEvaluation` boolean DEFAULT false,
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `resource_rules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `resource_schedules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`resourceId` int,
	`resourceTypeId` int,
	`locationId` int,
	`dayOfWeek` int NOT NULL,
	`openTime` varchar(5) NOT NULL,
	`closeTime` varchar(5) NOT NULL,
	`isActive` boolean DEFAULT true,
	CONSTRAINT `resource_schedules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `resource_types` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(128) NOT NULL,
	`slug` varchar(64) NOT NULL,
	`description` text,
	`icon` varchar(64),
	`defaultCapacity` int DEFAULT 1,
	`chargingUnit` enum('per_hour','per_day','per_use','per_week','per_month') NOT NULL DEFAULT 'per_hour',
	`timeSlotMinutes` int DEFAULT 15,
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `resource_types_id` PRIMARY KEY(`id`),
	CONSTRAINT `resource_types_slug_unique` UNIQUE(`slug`)
);
