import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, tinyint } from "drizzle-orm/mysql-core";

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
  role: mysqlEnum("role", ["user", "admin", "admin_master"]).default("user").notNull(),
  /** Password hash for local authentication */
  passwordHash: text("passwordHash"),
  /** Whether user can login with local credentials */
  localAuthEnabled: tinyint("localAuthEnabled").default(0).notNull(),
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
 * Airline Operations Table
 * Stores detailed operations data by airline from invoices
 */
export const airlineOperations = mysqlTable("airline_operations", {
  id: int("id").autoincrement().primaryKey(),
  invoiceId: varchar("invoiceId", { length: 255 }).notNull(),
  airline: varchar("airline", { length: 100 }).notNull(), // CIA Aérea
  passengerName: text("passengerName").notNull(), // Passageiro
  route: varchar("route", { length: 100 }), // Rota
  emissionDate: varchar("emissionDate", { length: 20 }), // Emissão
  ticketNumber: varchar("ticketNumber", { length: 50 }), // TKT/LOC
  tariff: int("tariff"), // Tarifa R$ (in cents)
  tax: int("tax"), // Taxa (in cents)
  cardRAV: int("cardRAV"), // Cartão/RAV (in cents)
  commission: int("commission"), // Comissão (in cents)
  incentive: int("incentive"), // Incentivo (in cents)
  discount: int("discount"), // Desconto (in cents)
  taxAmount: int("taxAmount"), // Imposto (in cents)
  fee: int("fee"), // Fee (in cents)
  adminFee: int("adminFee"), // TxAdmCt (in cents)
  netAmount: int("netAmount"), // Líquido (in cents)
  duTax: int("duTax"), // TxDU (in cents)
  observation: text("observation"), // Obs
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AirlineOperation = typeof airlineOperations.$inferSelect;
export type InsertAirlineOperation = typeof airlineOperations.$inferInsert;

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

/**
 * Validation Logs Table
 * Stores validation results for each invoice and ticket processing
 */
export const validationLogs = mysqlTable("validation_logs", {
  id: int("id").autoincrement().primaryKey(),
  invoiceId: varchar("invoiceId", { length: 255 }).notNull(),
  validationType: mysqlEnum("validationType", ["invoice", "ticket", "field"]).notNull(),
  fieldName: varchar("fieldName", { length: 100 }),
  fieldValue: text("fieldValue"),
  isValid: int("isValid").notNull(), // 1 for valid, 0 for invalid
  errorCode: varchar("errorCode", { length: 50 }),
  errorMessage: text("errorMessage"),
  severity: mysqlEnum("severity", ["error", "warning", "info"]).default("error").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ValidationLog = typeof validationLogs.$inferSelect;
export type InsertValidationLog = typeof validationLogs.$inferInsert;


/**
 * Suppliers/Vendors Table
 * Stores information about operators, consolidators, and other tourism companies
 */
export const suppliers = mysqlTable("suppliers", {
  id: int("id").autoincrement().primaryKey(),
  name: text("name").notNull(),
  cnpj: varchar("cnpj", { length: 20 }).notNull().unique(),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 20 }),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 2 }),
  zip: varchar("zip", { length: 10 }),
  supplierType: mysqlEnum("supplierType", ["operator", "consolidator", "airline", "hotel", "other"]).notNull(),
  bankAccount: varchar("bankAccount", { length: 50 }),
  bankCode: varchar("bankCode", { length: 10 }),
  bankBranch: varchar("bankBranch", { length: 10 }),
  isActive: int("isActive").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Supplier = typeof suppliers.$inferSelect;
export type InsertSupplier = typeof suppliers.$inferInsert;

/**
 * Accounts Payable Table
 * Tracks payments owed to suppliers
 */
export const accountsPayable = mysqlTable("accounts_payable", {
  id: int("id").autoincrement().primaryKey(),
  invoiceId: varchar("invoiceId", { length: 255 }).notNull(),
  supplierId: int("supplierId").notNull(),
  supplierName: text("supplierName").notNull(),
  amount: int("amount").notNull(), // stored in cents
  currency: varchar("currency", { length: 3 }).default("BRL").notNull(),
  dueDate: timestamp("dueDate").notNull(),
  paymentDate: timestamp("paymentDate"),
  status: mysqlEnum("status", ["pending", "paid", "overdue", "cancelled"]).default("pending").notNull(),
  paymentMethod: varchar("paymentMethod", { length: 50 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AccountPayable = typeof accountsPayable.$inferSelect;
export type InsertAccountPayable = typeof accountsPayable.$inferInsert;

/**
 * Accounts Receivable Table
 * Tracks payments owed by customers/agencies
 */
export const accountsReceivable = mysqlTable("accounts_receivable", {
  id: int("id").autoincrement().primaryKey(),
  invoiceId: varchar("invoiceId", { length: 255 }).notNull(),
  agencyName: text("agencyName").notNull(),
  agencyCNPJ: varchar("agencyCNPJ", { length: 20 }).notNull(),
  amount: int("amount").notNull(), // stored in cents
  currency: varchar("currency", { length: 3 }).default("BRL").notNull(),
  dueDate: timestamp("dueDate").notNull(),
  paymentDate: timestamp("paymentDate"),
  status: mysqlEnum("status", ["pending", "paid", "overdue", "cancelled"]).default("pending").notNull(),
  paymentMethod: varchar("paymentMethod", { length: 50 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AccountReceivable = typeof accountsReceivable.$inferSelect;
export type InsertAccountReceivable = typeof accountsReceivable.$inferInsert;

/**
 * Financial Analysis Table
 * Stores profitability analysis by operation/invoice
 */
export const financialAnalysis = mysqlTable("financial_analysis", {
  id: int("id").autoincrement().primaryKey(),
  invoiceId: varchar("invoiceId", { length: 255 }).notNull().unique(),
  agencyName: text("agencyName").notNull(),
  totalRevenue: int("totalRevenue").notNull(), // stored in cents
  totalCosts: int("totalCosts").notNull(), // stored in cents
  totalCommissions: int("totalCommissions"), // stored in cents
  totalIncentives: int("totalIncentives"), // stored in cents
  totalTaxes: int("totalTaxes"), // stored in cents
  netProfit: int("netProfit").notNull(), // stored in cents
  profitMargin: int("profitMargin"), // stored as percentage * 100 (e.g., 15.5% = 1550)
  currency: varchar("currency", { length: 3 }).default("BRL").notNull(),
  analysisDate: timestamp("analysisDate").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FinancialAnalysis = typeof financialAnalysis.$inferSelect;
export type InsertFinancialAnalysis = typeof financialAnalysis.$inferInsert;

/**
 * Reconciliation Records Table
 * Tracks reconciliation between invoices and payments
 */
export const reconciliationRecords = mysqlTable("reconciliation_records", {
  id: int("id").autoincrement().primaryKey(),
  invoiceId: varchar("invoiceId", { length: 255 }).notNull(),
  reconciliationType: mysqlEnum("reconciliationType", ["ap", "ar", "bank"]).notNull(),
  expectedAmount: int("expectedAmount").notNull(), // stored in cents
  actualAmount: int("actualAmount").notNull(), // stored in cents
  discrepancy: int("discrepancy"), // stored in cents
  status: mysqlEnum("status", ["matched", "unmatched", "partial", "resolved"]).default("unmatched").notNull(),
  notes: text("notes"),
  reconciliationDate: timestamp("reconciliationDate").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ReconciliationRecord = typeof reconciliationRecords.$inferSelect;
export type InsertReconciliationRecord = typeof reconciliationRecords.$inferInsert;

/**
 * Password Reset Tokens Table
 * Stores tokens for password recovery
 */
export const passwordResetTokens = mysqlTable("password_reset_tokens", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  token: varchar("token", { length: 255 }).notNull().unique(),
  expiresAt: timestamp("expiresAt").notNull(),
  usedAt: timestamp("usedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type InsertPasswordResetToken = typeof passwordResetTokens.$inferInsert;

/**
 * User Permissions Table
 * Defines what features each user can access
 */
export const userPermissions = mysqlTable("user_permissions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  permission: varchar("permission", { length: 100 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type UserPermission = typeof userPermissions.$inferSelect;
export type InsertUserPermission = typeof userPermissions.$inferInsert;
