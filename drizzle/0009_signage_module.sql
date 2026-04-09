-- ═══════════════════════════════════════════════════════════════════════
-- SKYNET Digital Signage Module - Migration 0009
-- ═══════════════════════════════════════════════════════════════════════

-- Signage Screens
CREATE TABLE IF NOT EXISTS `signage_screens` (
  `id` int AUTO_INCREMENT NOT NULL,
  `locationId` int NOT NULL,
  `name` varchar(255) NOT NULL,
  `screenType` enum('reception','gym','kitchen','wayfinding','general','meeting_room','elevator','parking') NOT NULL DEFAULT 'general',
  `status` enum('online','offline','provisioning','maintenance','error') NOT NULL DEFAULT 'provisioning',
  `orientation` enum('portrait','landscape') DEFAULT 'portrait',
  `resolution` varchar(20) DEFAULT '1080x1920',
  `ipAddress` varchar(45),
  `macAddress` varchar(17),
  `floor` varchar(10),
  `zone` varchar(100),
  `currentPlaylistId` int,
  `provisioningToken` varchar(100),
  `brightness` int DEFAULT 100,
  `volume` int DEFAULT 0,
  `isActive` boolean DEFAULT true,
  `tags` json DEFAULT ('[]'),
  `firmwareVersion` varchar(50),
  `userAgent` text,
  `lastHeartbeat` datetime,
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `signage_screens_id` PRIMARY KEY(`id`)
);

-- Signage Screen Groups
CREATE TABLE IF NOT EXISTS `signage_screen_groups` (
  `id` int AUTO_INCREMENT NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text,
  `locationId` int,
  `isActive` boolean DEFAULT true,
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `signage_screen_groups_id` PRIMARY KEY(`id`)
);

-- Signage Screen Group Members
CREATE TABLE IF NOT EXISTS `signage_screen_group_members` (
  `id` int AUTO_INCREMENT NOT NULL,
  `groupId` int NOT NULL,
  `screenId` int NOT NULL,
  CONSTRAINT `signage_screen_group_members_id` PRIMARY KEY(`id`)
);

-- Signage Content
CREATE TABLE IF NOT EXISTS `signage_content` (
  `id` int AUTO_INCREMENT NOT NULL,
  `title` varchar(255) NOT NULL,
  `contentType` enum('image','video','html','url','menu_card','wayfinding','gym_schedule','weather','clock','news_ticker','company_presence','welcome_screen','announcement') NOT NULL DEFAULT 'image',
  `mediaUrl` text,
  `htmlContent` longtext,
  `externalUrl` text,
  `duration` int DEFAULT 15,
  `templateData` json,
  `targetScreenTypes` json DEFAULT ('[]'),
  `locationId` int,
  `priority` int DEFAULT 0,
  `isActive` boolean DEFAULT true,
  `validFrom` datetime,
  `validUntil` datetime,
  `createdByUserId` int,
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `signage_content_id` PRIMARY KEY(`id`)
);

-- Signage Playlists
CREATE TABLE IF NOT EXISTS `signage_playlists` (
  `id` int AUTO_INCREMENT NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text,
  `screenType` enum('reception','gym','kitchen','wayfinding','general','meeting_room','elevator','parking'),
  `locationId` int,
  `isDefault` boolean DEFAULT false,
  `isActive` boolean DEFAULT true,
  `scheduleType` enum('always','time_based','day_based') DEFAULT 'always',
  `scheduleConfig` json,
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `signage_playlists_id` PRIMARY KEY(`id`)
);

-- Signage Playlist Items
CREATE TABLE IF NOT EXISTS `signage_playlist_items` (
  `id` int AUTO_INCREMENT NOT NULL,
  `playlistId` int NOT NULL,
  `contentId` int NOT NULL,
  `sortOrder` int DEFAULT 0,
  `durationOverride` int,
  `isActive` boolean DEFAULT true,
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `signage_playlist_items_id` PRIMARY KEY(`id`)
);

-- Signage Provisioning Templates
CREATE TABLE IF NOT EXISTS `signage_provisioning_templates` (
  `id` int AUTO_INCREMENT NOT NULL,
  `name` varchar(255) NOT NULL,
  `screenType` enum('reception','gym','kitchen','wayfinding','general','meeting_room','elevator','parking') NOT NULL,
  `defaultPlaylistId` int,
  `defaultOrientation` enum('portrait','landscape') DEFAULT 'portrait',
  `defaultResolution` varchar(20) DEFAULT '1080x1920',
  `defaultBrightness` int DEFAULT 100,
  `autoAssignLocation` boolean DEFAULT false,
  `configTemplate` json,
  `isActive` boolean DEFAULT true,
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `signage_provisioning_templates_id` PRIMARY KEY(`id`)
);

-- Wayfinding Buildings
CREATE TABLE IF NOT EXISTS `wayfinding_buildings` (
  `id` int AUTO_INCREMENT NOT NULL,
  `locationId` int NOT NULL,
  `name` varchar(255) NOT NULL,
  `code` varchar(10),
  `address` text,
  `floors` int DEFAULT 1,
  `mapImageUrl` text,
  `isActive` boolean DEFAULT true,
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `wayfinding_buildings_id` PRIMARY KEY(`id`)
);

-- Wayfinding Company Assignments
CREATE TABLE IF NOT EXISTS `wayfinding_company_assignments` (
  `id` int AUTO_INCREMENT NOT NULL,
  `companyId` int NOT NULL,
  `buildingId` int NOT NULL,
  `floor` varchar(10),
  `roomNumber` varchar(20),
  `isActive` boolean DEFAULT true,
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `wayfinding_company_assignments_id` PRIMARY KEY(`id`)
);

-- Wayfinding Company Presence (Dynamic check-in/out)
CREATE TABLE IF NOT EXISTS `wayfinding_company_presence` (
  `id` int AUTO_INCREMENT NOT NULL,
  `companyId` int NOT NULL,
  `locationId` int NOT NULL,
  `buildingId` int,
  `isPresent` boolean DEFAULT false,
  `checkedInAt` datetime,
  `checkedOutAt` datetime,
  `checkedInByUserId` int,
  `method` enum('manual','access_log','sensor','api') DEFAULT 'manual',
  `date` varchar(10) NOT NULL,
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `wayfinding_company_presence_id` PRIMARY KEY(`id`)
);

-- Signage Screen Heartbeats
CREATE TABLE IF NOT EXISTS `signage_heartbeats` (
  `id` int AUTO_INCREMENT NOT NULL,
  `screenId` int NOT NULL,
  `status` enum('online','offline','error','maintenance','provisioning') DEFAULT 'online',
  `currentContentId` int,
  `currentPlaylistId` int,
  `cpuUsage` decimal(5,2),
  `memoryUsage` decimal(5,2),
  `temperature` decimal(5,2),
  `uptime` int,
  `errorMessage` text,
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `signage_heartbeats_id` PRIMARY KEY(`id`)
);

-- Signage Audit Log
CREATE TABLE IF NOT EXISTS `signage_audit_log` (
  `id` int AUTO_INCREMENT NOT NULL,
  `screenId` int,
  `action` enum('provisioned','content_changed','playlist_assigned','screen_online','screen_offline','reboot','settings_changed','error_reported') NOT NULL,
  `description` text,
  `metadata` json,
  `userId` int,
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `signage_audit_log_id` PRIMARY KEY(`id`)
);

-- Kitchen Menu Items
CREATE TABLE IF NOT EXISTS `kitchen_menu_items` (
  `id` int AUTO_INCREMENT NOT NULL,
  `locationId` int NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text,
  `category` enum('breakfast','lunch','dinner','snack','drink','soup','salad','sandwich','special') NOT NULL DEFAULT 'lunch',
  `price` varchar(20),
  `imageUrl` text,
  `allergens` json DEFAULT ('[]'),
  `isVegan` boolean DEFAULT false,
  `isVegetarian` boolean DEFAULT false,
  `isGlutenFree` boolean DEFAULT false,
  `isAvailable` boolean DEFAULT true,
  `dayOfWeek` json DEFAULT ('[]'),
  `sortOrder` int DEFAULT 0,
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `kitchen_menu_items_id` PRIMARY KEY(`id`)
);

-- Gym Schedules
CREATE TABLE IF NOT EXISTS `gym_schedules` (
  `id` int AUTO_INCREMENT NOT NULL,
  `locationId` int NOT NULL,
  `className` varchar(255) NOT NULL,
  `instructor` varchar(255),
  `description` text,
  `category` enum('cardio','strength','yoga','pilates','hiit','cycling','boxing','stretching','meditation','egym') NOT NULL DEFAULT 'cardio',
  `dayOfWeek` int NOT NULL,
  `startTime` varchar(5) NOT NULL,
  `endTime` varchar(5) NOT NULL,
  `maxParticipants` int DEFAULT 20,
  `currentParticipants` int DEFAULT 0,
  `roomName` varchar(100),
  `imageUrl` text,
  `isActive` boolean DEFAULT true,
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `gym_schedules_id` PRIMARY KEY(`id`)
);

-- Indexes for performance
CREATE INDEX `idx_signage_screens_location` ON `signage_screens` (`locationId`);
CREATE INDEX `idx_signage_screens_type` ON `signage_screens` (`screenType`);
CREATE INDEX `idx_signage_screens_status` ON `signage_screens` (`status`);
CREATE INDEX `idx_signage_screens_token` ON `signage_screens` (`provisioningToken`);
CREATE INDEX `idx_signage_content_type` ON `signage_content` (`contentType`);
CREATE INDEX `idx_signage_content_location` ON `signage_content` (`locationId`);
CREATE INDEX `idx_signage_playlist_items_playlist` ON `signage_playlist_items` (`playlistId`);
CREATE INDEX `idx_wayfinding_presence_date` ON `wayfinding_company_presence` (`date`);
CREATE INDEX `idx_wayfinding_presence_location` ON `wayfinding_company_presence` (`locationId`);
CREATE INDEX `idx_wayfinding_presence_company` ON `wayfinding_company_presence` (`companyId`);
CREATE INDEX `idx_signage_heartbeats_screen` ON `signage_heartbeats` (`screenId`);
CREATE INDEX `idx_signage_heartbeats_created` ON `signage_heartbeats` (`createdAt`);
CREATE INDEX `idx_kitchen_menu_location` ON `kitchen_menu_items` (`locationId`);
CREATE INDEX `idx_gym_schedules_location` ON `gym_schedules` (`locationId`);
CREATE INDEX `idx_gym_schedules_day` ON `gym_schedules` (`dayOfWeek`);
