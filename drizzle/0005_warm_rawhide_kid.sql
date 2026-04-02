CREATE TABLE `booking_addons` (
	`id` int AUTO_INCREMENT NOT NULL,
	`bookingId` int NOT NULL,
	`productId` int NOT NULL,
	`quantity` int NOT NULL DEFAULT 1,
	`unitPriceCredits` decimal(10,2) NOT NULL,
	`totalCredits` decimal(10,2) NOT NULL,
	`proratedByHours` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `booking_addons_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `kiosk_order_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`productId` int NOT NULL,
	`productName` varchar(256) NOT NULL,
	`quantity` int NOT NULL DEFAULT 1,
	`unitPriceCredits` decimal(10,2) NOT NULL,
	`unitPriceEur` decimal(10,2) NOT NULL,
	`totalCredits` decimal(10,2) NOT NULL,
	`totalEur` decimal(10,2) NOT NULL,
	`vatRate` decimal(5,2) DEFAULT '21.00',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `kiosk_order_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `kiosk_orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderNumber` varchar(32) NOT NULL,
	`locationId` int NOT NULL,
	`userId` int,
	`companyId` int,
	`bookingId` int,
	`status` enum('pending','processing','completed','cancelled','refunded') DEFAULT 'pending',
	`paymentMethod` enum('personal_credits','company_credits','stripe_card','company_invoice','cash') NOT NULL,
	`subtotalCredits` decimal(10,2) DEFAULT '0',
	`subtotalEur` decimal(10,2) DEFAULT '0',
	`vatAmount` decimal(10,2) DEFAULT '0',
	`totalCredits` decimal(10,2) DEFAULT '0',
	`totalEur` decimal(10,2) DEFAULT '0',
	`stripePaymentIntentId` varchar(256),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `kiosk_orders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `product_categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(128) NOT NULL,
	`slug` varchar(64) NOT NULL,
	`description` text,
	`icon` varchar(64),
	`sortOrder` int DEFAULT 0,
	`isActive` boolean DEFAULT true,
	`locationId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `product_categories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `product_resource_links` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`resourceTypeId` int,
	`resourceId` int,
	`isRequired` boolean DEFAULT false,
	`isDefault` boolean DEFAULT false,
	`sortOrder` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `product_resource_links_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`categoryId` int NOT NULL,
	`name` varchar(256) NOT NULL,
	`description` text,
	`imageUrl` text,
	`priceCredits` decimal(10,2) NOT NULL,
	`priceEur` decimal(10,2) NOT NULL,
	`sku` varchar(64),
	`stockTracking` boolean DEFAULT false,
	`stockQuantity` int DEFAULT 0,
	`isActive` boolean DEFAULT true,
	`isBookingAddon` boolean DEFAULT false,
	`chargePerBookingHour` boolean DEFAULT false,
	`allowMultipleQuantity` boolean DEFAULT true,
	`maxQuantityPerOrder` int DEFAULT 10,
	`vatRate` decimal(5,2) DEFAULT '21.00',
	`sortOrder` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `products_id` PRIMARY KEY(`id`)
);
