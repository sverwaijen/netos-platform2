-- Phase 26: Next-Level Parking Module Upgrade
-- Pool subscriptions, SLA tiers, overbooking, access control

-- Upgrade parking_zones with overbooking fields
ALTER TABLE `parking_zones`
  ADD COLUMN `reservedSpots` int DEFAULT 0,
  ADD COLUMN `overbookingEnabled` boolean DEFAULT false,
  ADD COLUMN `overbookingRatio` decimal(4,2) DEFAULT 1.20,
  ADD COLUMN `noShowRateAvg` decimal(4,2) DEFAULT 0.25,
  ADD COLUMN `costUnderbooking` decimal(8,2) DEFAULT 75.00,
  ADD COLUMN `costOverbooking` decimal(8,2) DEFAULT 50.00,
  ADD COLUMN `payPerUseEnabled` boolean DEFAULT false,
  ADD COLUMN `payPerUseThreshold` int DEFAULT 85;

-- Upgrade parking_permits with SLA and pool fields
ALTER TABLE `parking_permits`
  ADD COLUMN `poolId` int,
  ADD COLUMN `slaTier` enum('platinum','gold','silver','bronze') DEFAULT 'silver',
  ADD COLUMN `noShowCount` int DEFAULT 0,
  ADD COLUMN `penaltyPoints` int DEFAULT 0;

-- Upgrade parking_sessions with entry method and access type
ALTER TABLE `parking_sessions`
  ADD COLUMN `poolId` int,
  ADD COLUMN `entryMethod` enum('anpr','qr','manual','app') DEFAULT 'anpr',
  ADD COLUMN `accessType` enum('member','visitor','external','pay_per_use','pool_guaranteed','pool_overflow') DEFAULT 'member';

-- Update parking_permits type enum to include pool and external
ALTER TABLE `parking_permits` MODIFY COLUMN `type` enum('monthly','annual','reserved','visitor','pool','external') DEFAULT 'monthly';

-- Update parking_sessions paymentMethod to include pool
ALTER TABLE `parking_sessions` MODIFY COLUMN `paymentMethod` enum('credits','stripe','permit','free','pool');

-- New: Parking Pools
CREATE TABLE IF NOT EXISTS `parking_pools` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `zoneId` int NOT NULL,
  `companyId` int,
  `name` varchar(128) NOT NULL,
  `guaranteedSpots` int NOT NULL DEFAULT 30,
  `maxMembers` int DEFAULT 0,
  `overflowPriceEur` decimal(8,2) DEFAULT 2.50,
  `overflowPriceDay` decimal(8,2) DEFAULT 15.00,
  `monthlyFeeEur` decimal(10,2) DEFAULT 0,
  `slaTier` enum('platinum','gold','silver','bronze') DEFAULT 'gold',
  `isActive` boolean DEFAULT true,
  `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updatedAt` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
);

-- New: Parking Pool Members
CREATE TABLE IF NOT EXISTS `parking_pool_members` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `poolId` int NOT NULL,
  `userId` int NOT NULL,
  `licensePlate` varchar(20),
  `licensePlate2` varchar(20),
  `role` enum('admin','member') DEFAULT 'member',
  `status` enum('active','suspended','removed') DEFAULT 'active',
  `joinedAt` timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `totalSessions` int DEFAULT 0,
  `totalOverflowSessions` int DEFAULT 0,
  `noShowCount` int DEFAULT 0
);

-- New: Parking Access Log
CREATE TABLE IF NOT EXISTS `parking_access_log` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `zoneId` int NOT NULL,
  `direction` enum('entry','exit') NOT NULL,
  `method` enum('anpr','qr','manual','app') NOT NULL,
  `licensePlate` varchar(20),
  `qrToken` varchar(128),
  `userId` int,
  `permitId` int,
  `poolId` int,
  `granted` boolean NOT NULL DEFAULT false,
  `denialReason` varchar(256),
  `sessionId` int,
  `responseTimeMs` int,
  `timestamp` bigint NOT NULL
);

-- New: Parking Visitor Permits
CREATE TABLE IF NOT EXISTS `parking_visitor_permits` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
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
  `status` enum('active','used','expired','cancelled') DEFAULT 'active',
  `shareMethod` enum('whatsapp','email','sms','link'),
  `notes` text,
  `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- New: Parking SLA Violations
CREATE TABLE IF NOT EXISTS `parking_sla_violations` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `zoneId` int NOT NULL,
  `userId` int NOT NULL,
  `permitId` int,
  `poolId` int,
  `slaTier` enum('platinum','gold','silver','bronze') NOT NULL,
  `violationType` enum('denied_entry','no_spot_available','downgrade') NOT NULL,
  `compensationEur` decimal(8,2) DEFAULT 0,
  `compensationCredits` decimal(8,2) DEFAULT 0,
  `compensationStatus` enum('pending','credited','waived') DEFAULT 'pending',
  `alternativeOffered` varchar(256),
  `timestamp` bigint NOT NULL,
  `resolvedAt` bigint,
  `notes` text
);

-- New: Parking Capacity Snapshots
CREATE TABLE IF NOT EXISTS `parking_capacity_snapshots` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
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
  `overbookingHeadroom` int DEFAULT 0
);

-- Indexes for performance
CREATE INDEX `idx_pool_members_pool` ON `parking_pool_members` (`poolId`);
CREATE INDEX `idx_pool_members_user` ON `parking_pool_members` (`userId`);
CREATE INDEX `idx_access_log_zone_ts` ON `parking_access_log` (`zoneId`, `timestamp`);
CREATE INDEX `idx_access_log_plate` ON `parking_access_log` (`licensePlate`);
CREATE INDEX `idx_visitor_permits_qr` ON `parking_visitor_permits` (`qrToken`);
CREATE INDEX `idx_visitor_permits_zone` ON `parking_visitor_permits` (`zoneId`, `validFrom`, `validUntil`);
CREATE INDEX `idx_capacity_zone_ts` ON `parking_capacity_snapshots` (`zoneId`, `timestamp`);
CREATE INDEX `idx_sessions_pool` ON `parking_sessions` (`poolId`);
CREATE INDEX `idx_permits_pool` ON `parking_permits` (`poolId`);
