CREATE TABLE `approvals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`listingId` int NOT NULL,
	`adminId` int NOT NULL,
	`decision` enum('approved','rejected') NOT NULL,
	`reason` text,
	`paymentVerified` boolean DEFAULT false,
	`inspectionNotes` text,
	`decidedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `approvals_id` PRIMARY KEY(`id`),
	CONSTRAINT `approvals_listingId_unique` UNIQUE(`listingId`)
);
--> statement-breakpoint
CREATE TABLE `landlords` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`companyName` text,
	`phoneNumber` varchar(20) NOT NULL,
	`alternatePhone` varchar(20),
	`bankAccountName` text,
	`bankAccountNumber` text,
	`bankName` text,
	`verificationStatus` enum('unverified','verified','rejected') NOT NULL DEFAULT 'unverified',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `landlords_id` PRIMARY KEY(`id`),
	CONSTRAINT `landlords_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `listings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`landlordId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`address` text NOT NULL,
	`latitude` decimal(10,8),
	`longitude` decimal(11,8),
	`pricePerMonth` decimal(10,2) NOT NULL,
	`numberOfRooms` int,
	`occupancyPerRoom` int,
	`status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`rejectionReason` text,
	`services` json NOT NULL DEFAULT ('[]'),
	`rules` text,
	`contactPhone` varchar(20) NOT NULL,
	`contactEmail` varchar(320),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`approvedAt` timestamp,
	CONSTRAINT `listings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `media` (
	`id` int AUTO_INCREMENT NOT NULL,
	`listingId` int NOT NULL,
	`type` enum('image','video') NOT NULL,
	`url` text NOT NULL,
	`storageKey` text NOT NULL,
	`fileName` varchar(255),
	`mimeType` varchar(100),
	`displayOrder` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `media_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('new_submission','approval','rejection','system') NOT NULL,
	`title` varchar(255) NOT NULL,
	`message` text,
	`relatedListingId` int,
	`isRead` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','admin','landlord') NOT NULL DEFAULT 'user';