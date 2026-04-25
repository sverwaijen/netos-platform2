ALTER TABLE `company_branding` MODIFY COLUMN `primaryColor` varchar(9) DEFAULT '#1a1a2e';--> statement-breakpoint
ALTER TABLE `company_branding` MODIFY COLUMN `secondaryColor` varchar(9) DEFAULT '#e94560';--> statement-breakpoint
ALTER TABLE `company_branding` ADD `accentColor` varchar(9) DEFAULT '#b8a472';--> statement-breakpoint
ALTER TABLE `company_branding` ADD `fontFamily` varchar(128) DEFAULT 'Inter';