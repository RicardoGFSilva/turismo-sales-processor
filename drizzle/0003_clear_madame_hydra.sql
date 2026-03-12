CREATE TABLE `validation_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`invoiceId` varchar(255) NOT NULL,
	`validationType` enum('invoice','ticket','field') NOT NULL,
	`fieldName` varchar(100),
	`fieldValue` text,
	`isValid` int NOT NULL,
	`errorCode` varchar(50),
	`errorMessage` text,
	`severity` enum('error','warning','info') NOT NULL DEFAULT 'error',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `validation_logs_id` PRIMARY KEY(`id`)
);
