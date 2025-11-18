import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Sales Invoices Table
 * Stores invoice/fatura information from PDF files
 */
export const salesInvoices = mysqlTable("sales_invoices", {
  id: int("id").autoincrement().primaryKey(),
  invoiceId: varchar("invoiceId", { length: 255 }).notNull().unique(),
  agencyName: text("agencyName").notNull(),
  agencyCNPJ: varchar("agencyCNPJ", { length: 20 }).notNull(),
  agencyEmail: varchar("agencyEmail", { length: 320 }),
  agencyAddress: text("agencyAddress"),
  clientName: text("clientName").notNull(),
  clientCNPJ: varchar("clientCNPJ", { length: 20 }).notNull(),
  clientAddress: text("clientAddress"),
  clientCity: varchar("clientCity", { length: 100 }),
  clientState: varchar("clientState", { length: 2 }),
  clientZip: varchar("clientZip", { length: 10 }),
  pdfPath: varchar("pdfPath", { length: 500 }),
  totalTariff: int("totalTariff"), // stored in cents
  totalTax: int("totalTax"), // stored in cents
  totalCommission: int("totalCommission"), // stored in cents
  totalIncentive: int("totalIncentive"), // stored in cents
  totalDiscount: int("totalDiscount"), // stored in cents
  totalFee: int("totalFee"), // stored in cents
  totalNetAmount: int("totalNetAmount"), // stored in cents
  validationStatus: mysqlEnum("validationStatus", ["valid", "warning", "error", "pending"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SalesInvoice = typeof salesInvoices.$inferSelect;
export type InsertSalesInvoice = typeof salesInvoices.$inferInsert;

/**
 * Sales Tickets Table
 * Stores individual ticket/bilhete information extracted from invoices
 */
export const salesTickets = mysqlTable("sales_tickets", {
  id: int("id").autoincrement().primaryKey(),
  invoiceId: varchar("invoiceId", { length: 255 }).notNull(),
  passengerName: text("passengerName").notNull(),
  route: varchar("route", { length: 50 }),
  airline: varchar("airline", { length: 10 }),
  saleType: varchar("saleType", { length: 50 }), // Domestico, Internacional, etc
  emissionDate: varchar("emissionDate", { length: 20 }),
  ticketNumber: varchar("ticketNumber", { length: 50 }),
  locator: varchar("locator", { length: 50 }),
  tariff: int("tariff"), // stored in cents
  tax: int("tax"), // stored in cents
  cardRAV: int("cardRAV"), // stored in cents
  commission: int("commission"), // stored in cents
  incentive: int("incentive"), // stored in cents
  discount: int("discount"), // stored in cents
  taxAmount: int("taxAmount"), // stored in cents
  fee: int("fee"), // stored in cents
  adminFee: int("adminFee"), // stored in cents
  netAmount: int("netAmount"), // stored in cents
  duTax: int("duTax"), // stored in cents
  observation: text("observation"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SalesTicket = typeof salesTickets.$inferSelect;
export type InsertSalesTicket = typeof salesTickets.$inferInsert;

/**
 * Invoice Details Table
 * Stores additional details and attachments for invoices
 */
export const invoiceDetails = mysqlTable("invoice_details", {
  id: int("id").autoincrement().primaryKey(),
  invoiceId: varchar("invoiceId", { length: 255 }).notNull().unique(),
  finalClientName: text("finalClientName"),
  voucherPath: varchar("voucherPath", { length: 500 }),
  billetPath: varchar("billetPath", { length: 500 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type InvoiceDetail = typeof invoiceDetails.$inferSelect;
export type InsertInvoiceDetail = typeof invoiceDetails.$inferInsert;

/**
 * PDF Mappings Table
 * Stores column mappings for different PDF formats (De-Para)
 */
export const pdfMappings = mysqlTable("pdf_mappings", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  platformName: varchar("platformName", { length: 255 }).notNull(),
  columnMapping: text("columnMapping"), // JSON string
  isActive: int("isActive").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PDFMapping = typeof pdfMappings.$inferSelect;
export type InsertPDFMapping = typeof pdfMappings.$inferInsert;