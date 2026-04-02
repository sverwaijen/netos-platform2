CREATE TABLE `company_branding_scraped` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int NOT NULL,
	`websiteUrl` text,
	`scrapedLogoUrl` text,
	`scrapedFaviconUrl` text,
	`scrapedColors` json,
	`scrapedImages` json,
	`scrapedFonts` json,
	`scrapedTitle` varchar(256),
	`scrapedDescription` text,
	`status` enum('pending','scraping','completed','failed') DEFAULT 'pending',
	`lastScrapedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `company_branding_scraped_id` PRIMARY KEY(`id`)
);
