CREATE TABLE `alert_thresholds` (
	`id` int AUTO_INCREMENT NOT NULL,
	`zoneId` int,
	`locationId` int,
	`sensorType` enum('temperature','humidity','co2','noise','light','occupancy','pm25','voc') NOT NULL,
	`operator` enum('gt','lt','gte','lte','eq') NOT NULL,
	`thresholdValue` decimal(10,2) NOT NULL,
	`alertLevel` enum('info','warning','critical') DEFAULT 'warning',
	`notifyRoles` json,
	`cooldownMinutes` int DEFAULT 30,
	`isActive` boolean DEFAULT true,
	`lastTriggeredAt` bigint,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `alert_thresholds_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `canned_responses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(256) NOT NULL,
	`body` text NOT NULL,
	`category` varchar(64),
	`shortcut` varchar(32),
	`usageCount` int DEFAULT 0,
	`createdByUserId` int,
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `canned_responses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ops_agenda` (
	`id` int AUTO_INCREMENT NOT NULL,
	`locationId` int NOT NULL,
	`title` varchar(256) NOT NULL,
	`description` text,
	`type` enum('event','maintenance','cleaning','delivery','meeting','inspection','other') DEFAULT 'event',
	`startTime` bigint NOT NULL,
	`endTime` bigint,
	`assignedToId` int,
	`status` enum('scheduled','in_progress','completed','cancelled') DEFAULT 'scheduled',
	`priority` enum('low','normal','high','urgent') DEFAULT 'normal',
	`isRecurring` boolean DEFAULT false,
	`recurringPattern` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ops_agenda_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `parking_permits` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`companyId` int,
	`zoneId` int NOT NULL,
	`licensePlate` varchar(20) NOT NULL,
	`vehicleDescription` varchar(256),
	`type` enum('monthly','annual','reserved','visitor') DEFAULT 'monthly',
	`status` enum('active','expired','suspended','cancelled') DEFAULT 'active',
	`startDate` bigint NOT NULL,
	`endDate` bigint,
	`spotId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `parking_permits_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `parking_pricing` (
	`id` int AUTO_INCREMENT NOT NULL,
	`zoneId` int,
	`name` varchar(128) NOT NULL,
	`rateType` enum('hourly','daily','monthly','flat') NOT NULL,
	`priceEur` decimal(10,2) NOT NULL,
	`priceCredits` decimal(10,2),
	`appliesToType` enum('all','members','guests','companies') DEFAULT 'all',
	`dayBeforeDiscount` int DEFAULT 0,
	`maxDailyCapEur` decimal(10,2),
	`freeMinutes` int DEFAULT 0,
	`validDays` json,
	`validTimeStart` varchar(5),
	`validTimeEnd` varchar(5),
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `parking_pricing_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `parking_reservations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`zoneId` int NOT NULL,
	`spotId` int,
	`userId` int NOT NULL,
	`licensePlate` varchar(20),
	`reservationDate` bigint NOT NULL,
	`startTime` bigint NOT NULL,
	`endTime` bigint NOT NULL,
	`status` enum('confirmed','checked_in','completed','cancelled','no_show') DEFAULT 'confirmed',
	`discountApplied` int DEFAULT 0,
	`amountEur` decimal(10,2),
	`amountCredits` decimal(10,2),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `parking_reservations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `parking_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`zoneId` int NOT NULL,
	`spotId` int,
	`userId` int,
	`permitId` int,
	`licensePlate` varchar(20),
	`entryTime` bigint NOT NULL,
	`exitTime` bigint,
	`durationMinutes` int,
	`status` enum('active','completed','overstay') DEFAULT 'active',
	`amountEur` decimal(10,2),
	`amountCredits` decimal(10,2),
	`paymentMethod` enum('credits','stripe','permit','free'),
	`paymentStatus` enum('pending','paid','waived') DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `parking_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `parking_spots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`zoneId` int NOT NULL,
	`spotNumber` varchar(16) NOT NULL,
	`type` enum('standard','electric','disabled','motorcycle','reserved') DEFAULT 'standard',
	`status` enum('available','occupied','reserved','maintenance','blocked') DEFAULT 'available',
	`sensorId` varchar(128),
	`assignedUserId` int,
	`assignedCompanyId` int,
	`isActive` boolean DEFAULT true,
	CONSTRAINT `parking_spots_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `parking_zones` (
	`id` int AUTO_INCREMENT NOT NULL,
	`locationId` int NOT NULL,
	`name` varchar(128) NOT NULL,
	`slug` varchar(64) NOT NULL,
	`totalSpots` int NOT NULL DEFAULT 0,
	`type` enum('indoor','outdoor','underground','rooftop') DEFAULT 'outdoor',
	`accessMethod` enum('barrier','anpr','manual','salto') DEFAULT 'barrier',
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `parking_zones_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `room_automation_rules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`zoneId` int,
	`locationId` int,
	`name` varchar(256) NOT NULL,
	`triggerType` enum('schedule','occupancy','sensor_threshold','booking_start','booking_end') NOT NULL,
	`triggerConfig` json,
	`actionType` enum('set_temperature','set_lights','set_av','set_blinds','send_alert') NOT NULL,
	`actionConfig` json,
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `room_automation_rules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `room_control_points` (
	`id` int AUTO_INCREMENT NOT NULL,
	`zoneId` int NOT NULL,
	`name` varchar(128) NOT NULL,
	`type` enum('hvac_temp','hvac_mode','light_level','light_scene','av_power','av_input','blinds_position','ventilation') NOT NULL,
	`currentValue` varchar(64),
	`targetValue` varchar(64),
	`unit` varchar(16),
	`minValue` decimal(8,2),
	`maxValue` decimal(8,2),
	`isControllable` boolean DEFAULT true,
	`lastUpdated` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `room_control_points_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `room_control_zones` (
	`id` int AUTO_INCREMENT NOT NULL,
	`locationId` int NOT NULL,
	`resourceId` int,
	`name` varchar(128) NOT NULL,
	`floor` varchar(16),
	`type` enum('meeting_room','open_space','private_office','common_area','lobby','kitchen') DEFAULT 'meeting_room',
	`hvacEnabled` boolean DEFAULT true,
	`lightingEnabled` boolean DEFAULT true,
	`avEnabled` boolean DEFAULT false,
	`blindsEnabled` boolean DEFAULT false,
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `room_control_zones_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `room_sensor_readings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`zoneId` int NOT NULL,
	`sensorType` enum('temperature','humidity','co2','noise','light','occupancy','pm25','voc') NOT NULL,
	`value` decimal(10,2) NOT NULL,
	`unit` varchar(16),
	`recordedAt` bigint NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `room_sensor_readings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ticket_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ticketId` int NOT NULL,
	`senderId` int,
	`senderType` enum('requester','agent','system','ai') DEFAULT 'requester',
	`body` text NOT NULL,
	`isInternal` boolean DEFAULT false,
	`attachments` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ticket_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ticket_sla_policies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(128) NOT NULL,
	`priority` enum('low','normal','high','urgent') NOT NULL,
	`firstResponseMinutes` int NOT NULL,
	`resolutionMinutes` int NOT NULL,
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ticket_sla_policies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tickets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ticketNumber` varchar(32) NOT NULL,
	`subject` varchar(512) NOT NULL,
	`description` text,
	`status` enum('new','open','pending','on_hold','solved','closed') NOT NULL DEFAULT 'new',
	`priority` enum('low','normal','high','urgent') DEFAULT 'normal',
	`category` enum('general','billing','access','booking','parking','maintenance','wifi','catering','equipment','noise','cleaning','other') DEFAULT 'general',
	`channel` enum('web','email','chat','phone','app','walk_in') DEFAULT 'web',
	`requesterId` int,
	`assignedToId` int,
	`locationId` int,
	`resourceId` int,
	`tags` json,
	`aiSuggestion` text,
	`aiCategory` varchar(64),
	`aiSentiment` enum('positive','neutral','negative'),
	`aiAutoResolved` boolean DEFAULT false,
	`slaDeadline` bigint,
	`firstResponseAt` bigint,
	`resolvedAt` bigint,
	`closedAt` bigint,
	`satisfactionRating` int,
	`satisfactionComment` text,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tickets_id` PRIMARY KEY(`id`),
	CONSTRAINT `tickets_ticketNumber_unique` UNIQUE(`ticketNumber`)
);
