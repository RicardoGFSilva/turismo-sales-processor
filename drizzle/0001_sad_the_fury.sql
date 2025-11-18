CREATE TABLE `invoice_details` (
	`id` int AUTO_INCREMENT NOT NULL,
	`invoiceId` varchar(255) NOT NULL,
	`finalClientName` text,
	`voucherPath` varchar(500),
	`billetPath` varchar(500),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `invoice_details_id` PRIMARY KEY(`id`),
	CONSTRAINT `invoice_details_invoiceId_unique` UNIQUE(`invoiceId`)
);
--> statement-breakpoint
CREATE TABLE `pdf_mappings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`platformName` varchar(255) NOT NULL,
	`columnMapping` text,
	`isActive` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pdf_mappings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sales_invoices` (
	`id` int AUTO_INCREMENT NOT NULL,
	`invoiceId` varchar(255) NOT NULL,
	`agencyName` text NOT NULL,
	`agencyCNPJ` varchar(20) NOT NULL,
	`agencyEmail` varchar(320),
	`agencyAddress` text,
	`clientName` text NOT NULL,
	`clientCNPJ` varchar(20) NOT NULL,
	`clientAddress` text,
	`clientCity` varchar(100),
	`clientState` varchar(2),
	`clientZip` varchar(10),
	`pdfPath` varchar(500),
	`totalTariff` int,
	`totalTax` int,
	`totalCommission` int,
	`totalIncentive` int,
	`totalDiscount` int,
	`totalFee` int,
	`totalNetAmount` int,
	`validationStatus` enum('valid','warning','error','pending') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `sales_invoices_id` PRIMARY KEY(`id`),
	CONSTRAINT `sales_invoices_invoiceId_unique` UNIQUE(`invoiceId`)
);
--> statement-breakpoint
CREATE TABLE `sales_tickets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`invoiceId` varchar(255) NOT NULL,
	`passengerName` text NOT NULL,
	`route` varchar(50),
	`airline` varchar(10),
	`saleType` varchar(50),
	`emissionDate` varchar(20),
	`ticketNumber` varchar(50),
	`locator` varchar(50),
	`tariff` int,
	`tax` int,
	`cardRAV` int,
	`commission` int,
	`incentive` int,
	`discount` int,
	`taxAmount` int,
	`fee` int,
	`adminFee` int,
	`netAmount` int,
	`duTax` int,
	`observation` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `sales_tickets_id` PRIMARY KEY(`id`)
);
