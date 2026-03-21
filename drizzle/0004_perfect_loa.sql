CREATE TABLE `accounts_payable` (
	`id` int AUTO_INCREMENT NOT NULL,
	`invoiceId` varchar(255) NOT NULL,
	`supplierId` int NOT NULL,
	`supplierName` text NOT NULL,
	`amount` int NOT NULL,
	`currency` varchar(3) NOT NULL DEFAULT 'BRL',
	`dueDate` timestamp NOT NULL,
	`paymentDate` timestamp,
	`status` enum('pending','paid','overdue','cancelled') NOT NULL DEFAULT 'pending',
	`paymentMethod` varchar(50),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `accounts_payable_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `accounts_receivable` (
	`id` int AUTO_INCREMENT NOT NULL,
	`invoiceId` varchar(255) NOT NULL,
	`agencyName` text NOT NULL,
	`agencyCNPJ` varchar(20) NOT NULL,
	`amount` int NOT NULL,
	`currency` varchar(3) NOT NULL DEFAULT 'BRL',
	`dueDate` timestamp NOT NULL,
	`paymentDate` timestamp,
	`status` enum('pending','paid','overdue','cancelled') NOT NULL DEFAULT 'pending',
	`paymentMethod` varchar(50),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `accounts_receivable_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `financial_analysis` (
	`id` int AUTO_INCREMENT NOT NULL,
	`invoiceId` varchar(255) NOT NULL,
	`agencyName` text NOT NULL,
	`totalRevenue` int NOT NULL,
	`totalCosts` int NOT NULL,
	`totalCommissions` int,
	`totalIncentives` int,
	`totalTaxes` int,
	`netProfit` int NOT NULL,
	`profitMargin` int,
	`currency` varchar(3) NOT NULL DEFAULT 'BRL',
	`analysisDate` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `financial_analysis_id` PRIMARY KEY(`id`),
	CONSTRAINT `financial_analysis_invoiceId_unique` UNIQUE(`invoiceId`)
);
--> statement-breakpoint
CREATE TABLE `reconciliation_records` (
	`id` int AUTO_INCREMENT NOT NULL,
	`invoiceId` varchar(255) NOT NULL,
	`reconciliationType` enum('ap','ar','bank') NOT NULL,
	`expectedAmount` int NOT NULL,
	`actualAmount` int NOT NULL,
	`discrepancy` int,
	`status` enum('matched','unmatched','partial','resolved') NOT NULL DEFAULT 'unmatched',
	`notes` text,
	`reconciliationDate` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `reconciliation_records_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `suppliers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` text NOT NULL,
	`cnpj` varchar(20) NOT NULL,
	`email` varchar(320),
	`phone` varchar(20),
	`address` text,
	`city` varchar(100),
	`state` varchar(2),
	`zip` varchar(10),
	`supplierType` enum('operator','consolidator','airline','hotel','other') NOT NULL,
	`bankAccount` varchar(50),
	`bankCode` varchar(10),
	`bankBranch` varchar(10),
	`isActive` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `suppliers_id` PRIMARY KEY(`id`),
	CONSTRAINT `suppliers_cnpj_unique` UNIQUE(`cnpj`)
);
