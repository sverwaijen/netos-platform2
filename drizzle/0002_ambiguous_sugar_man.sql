CREATE TABLE `crm_campaign_enrollments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`campaignId` int NOT NULL,
	`leadId` int NOT NULL,
	`currentStepId` int,
	`status` enum('active','completed','paused','bounced','unsubscribed') NOT NULL DEFAULT 'active',
	`nextSendAt` bigint,
	`enrolledAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	CONSTRAINT `crm_campaign_enrollments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `crm_campaign_steps` (
	`id` int AUTO_INCREMENT NOT NULL,
	`campaignId` int NOT NULL,
	`stepOrder` int NOT NULL,
	`delayDays` int DEFAULT 0,
	`subject` varchar(512),
	`body` text,
	`isAiGenerated` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `crm_campaign_steps_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `crm_campaigns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(256) NOT NULL,
	`description` text,
	`type` enum('email_sequence','one_off','drip','event') DEFAULT 'email_sequence',
	`status` enum('draft','active','paused','completed','archived') NOT NULL DEFAULT 'draft',
	`targetAudience` text,
	`totalLeads` int DEFAULT 0,
	`sentCount` int DEFAULT 0,
	`openCount` int DEFAULT 0,
	`clickCount` int DEFAULT 0,
	`replyCount` int DEFAULT 0,
	`conversionCount` int DEFAULT 0,
	`createdByUserId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `crm_campaigns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `crm_email_templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(256) NOT NULL,
	`subject` varchar(512) NOT NULL,
	`body` text NOT NULL,
	`category` varchar(64),
	`isAiGenerated` boolean DEFAULT false,
	`usageCount` int DEFAULT 0,
	`createdByUserId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `crm_email_templates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `crm_lead_activities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`leadId` int NOT NULL,
	`userId` int,
	`type` enum('note','email_sent','email_opened','email_clicked','email_replied','call','meeting','tour','proposal_sent','stage_change','score_change','task') NOT NULL,
	`title` varchar(256) NOT NULL,
	`description` text,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `crm_lead_activities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `crm_leads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyName` varchar(256) NOT NULL,
	`contactName` varchar(256),
	`contactEmail` varchar(320),
	`contactPhone` varchar(20),
	`companySize` varchar(32),
	`industry` varchar(128),
	`website` varchar(512),
	`locationPreference` varchar(128),
	`budgetRange` varchar(64),
	`source` enum('website','referral','event','cold_outreach','linkedin','partner','inbound','other') DEFAULT 'inbound',
	`stage` enum('new','qualified','tour_scheduled','proposal','negotiation','won','lost') NOT NULL DEFAULT 'new',
	`score` int DEFAULT 0,
	`estimatedValue` decimal(12,2),
	`assignedToUserId` int,
	`notes` text,
	`lostReason` text,
	`wonDate` timestamp,
	`nextFollowUp` bigint,
	`tags` json,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `crm_leads_id` PRIMARY KEY(`id`)
);
