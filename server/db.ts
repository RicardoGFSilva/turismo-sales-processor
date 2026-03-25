import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, passwordResetTokens, userPermissions } from "../drizzle/schema";
import { eq, gt, isNull } from "drizzle-orm";
import { ENV } from './_core/env';
import crypto from 'crypto';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// TODO: add feature queries here as your schema grows.


import { validationLogs, InsertValidationLog, salesInvoices } from "../drizzle/schema";
import { sql, and, count, desc, gte } from "drizzle-orm";

export async function insertValidationLog(log: InsertValidationLog): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot insert validation log: database not available");
    return;
  }

  try {
    await db.insert(validationLogs).values(log);
  } catch (error) {
    console.error("[Database] Failed to insert validation log:", error);
  }
}

export async function getValidationStats(daysBack: number = 30) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get validation stats: database not available");
    return null;
  }

  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);

    // Total invoices processed
    const totalInvoices = await db
      .select({ count: count() })
      .from(salesInvoices)
      .where(gte(salesInvoices.createdAt, cutoffDate));

    // Invoices by validation status
    const invoicesByStatus = await db
      .select({
        status: salesInvoices.validationStatus,
        count: count(),
      })
      .from(salesInvoices)
      .where(gte(salesInvoices.createdAt, cutoffDate))
      .groupBy(salesInvoices.validationStatus);

    // Total validation logs (errors, warnings, info)
    const validationLogsByType = await db
      .select({
        severity: validationLogs.severity,
        count: count(),
      })
      .from(validationLogs)
      .where(gte(validationLogs.createdAt, cutoffDate))
      .groupBy(validationLogs.severity);

    // Most common errors
    const commonErrors = await db
      .select({
        errorCode: validationLogs.errorCode,
        errorMessage: validationLogs.errorMessage,
        count: count(),
      })
      .from(validationLogs)
      .where(
        and(
          gte(validationLogs.createdAt, cutoffDate),
          sql`${validationLogs.isValid} = 0`
        )
      )
      .groupBy(validationLogs.errorCode, validationLogs.errorMessage)
      .orderBy(desc(count()))
      .limit(10);

    // Validation errors by field
    const errorsByField = await db
      .select({
        fieldName: validationLogs.fieldName,
        count: count(),
      })
      .from(validationLogs)
      .where(
        and(
          gte(validationLogs.createdAt, cutoffDate),
          sql`${validationLogs.isValid} = 0`
        )
      )
      .groupBy(validationLogs.fieldName)
      .orderBy(desc(count()))
      .limit(10);

    return {
      totalInvoices: totalInvoices[0]?.count || 0,
      invoicesByStatus,
      validationLogsByType,
      commonErrors,
      errorsByField,
      daysBack,
    };
  } catch (error) {
    console.error("[Database] Failed to get validation stats:", error);
    return null;
  }
}

export async function getValidationTrends(daysBack: number = 30) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get validation trends: database not available");
    return null;
  }

  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);

    // Daily invoice count
    const dailyInvoices = await db.execute(
      sql`
        SELECT DATE(${salesInvoices.createdAt}) as date, COUNT(*) as count
        FROM ${salesInvoices}
        WHERE ${salesInvoices.createdAt} >= ${cutoffDate}
        GROUP BY DATE(${salesInvoices.createdAt})
        ORDER BY DATE(${salesInvoices.createdAt})
      `
    ) as any;

    // Daily validation errors
    const dailyErrors = await db.execute(
      sql`
        SELECT DATE(${validationLogs.createdAt}) as date, COUNT(*) as count
        FROM ${validationLogs}
        WHERE ${validationLogs.createdAt} >= ${cutoffDate} AND ${validationLogs.isValid} = 0
        GROUP BY DATE(${validationLogs.createdAt})
        ORDER BY DATE(${validationLogs.createdAt})
      `
    ) as any;

    return {
      dailyInvoices: dailyInvoices || [],
      dailyErrors: dailyErrors || [],
      daysBack,
    };
  } catch (error) {
    console.error("[Database] Failed to get validation trends:", error);
    return null;
  }
}


export async function getAgencySuccessRates(daysBack: number = 30) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get agency success rates: database not available");
    return null;
  }

  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);

    // Success rate by agency
    const agencyStats = await db.execute(
      sql`
        SELECT 
          ${salesInvoices.agencyName},
          COUNT(*) as total,
          SUM(CASE WHEN ${salesInvoices.validationStatus} = 'valid' THEN 1 ELSE 0 END) as valid,
          SUM(CASE WHEN ${salesInvoices.validationStatus} = 'warning' THEN 1 ELSE 0 END) as warning,
          SUM(CASE WHEN ${salesInvoices.validationStatus} = 'error' THEN 1 ELSE 0 END) as error,
          SUM(CASE WHEN ${salesInvoices.validationStatus} = 'pending' THEN 1 ELSE 0 END) as pending
        FROM ${salesInvoices}
        WHERE ${salesInvoices.createdAt} >= ${cutoffDate}
        GROUP BY ${salesInvoices.agencyName}
        ORDER BY total DESC
      `
    ) as any;

    // Format the results
    const formattedStats = (agencyStats || []).map((stat: any) => ({
      agencyName: stat.agencyName,
      total: stat.total || 0,
      valid: stat.valid || 0,
      warning: stat.warning || 0,
      error: stat.error || 0,
      pending: stat.pending || 0,
      successRate: stat.total > 0 ? Math.round(((stat.valid || 0) / stat.total) * 100) : 0,
    }));

    return {
      agencyStats: formattedStats,
      daysBack,
    };
  } catch (error) {
    console.error("[Database] Failed to get agency success rates:", error);
    return null;
  }
}

export async function getProcessingTrendsByAgency(daysBack: number = 30) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get processing trends by agency: database not available");
    return null;
  }

  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);

    // Daily processing by agency
    const trends = await db.execute(
      sql`
        SELECT 
          DATE(${salesInvoices.createdAt}) as date,
          ${salesInvoices.agencyName},
          COUNT(*) as count
        FROM ${salesInvoices}
        WHERE ${salesInvoices.createdAt} >= ${cutoffDate}
        GROUP BY DATE(${salesInvoices.createdAt}), ${salesInvoices.agencyName}
        ORDER BY DATE(${salesInvoices.createdAt}), ${salesInvoices.agencyName}
      `
    ) as any;

    return {
      trends: trends || [],
      daysBack,
    };
  } catch (error) {
    console.error("[Database] Failed to get processing trends by agency:", error);
    return null;
  }
}


// Accounts Payable Functions
import { suppliers, accountsPayable, accountsReceivable, financialAnalysis, reconciliationRecords, InsertAccountPayable, InsertAccountReceivable, InsertSupplier } from "../drizzle/schema";

export async function getAccountsPayable(daysBack: number = 30) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get accounts payable: database not available");
    return null;
  }

  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);

    const apData = await db.execute(
      sql`
        SELECT 
          ${accountsPayable.id},
          ${accountsPayable.invoiceId},
          ${accountsPayable.supplierName},
          ${accountsPayable.amount},
          ${accountsPayable.currency},
          ${accountsPayable.dueDate},
          ${accountsPayable.paymentDate},
          ${accountsPayable.status},
          DATEDIFF(${accountsPayable.dueDate}, NOW()) as daysUntilDue
        FROM ${accountsPayable}
        WHERE ${accountsPayable.createdAt} >= ${cutoffDate}
        ORDER BY ${accountsPayable.dueDate} ASC
      `
    ) as any;

    return apData || [];
  } catch (error) {
    console.error("[Database] Failed to get accounts payable:", error);
    return null;
  }
}

export async function getAccountsReceivable(daysBack: number = 30) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get accounts receivable: database not available");
    return null;
  }

  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);

    const arData = await db.execute(
      sql`
        SELECT 
          ${accountsReceivable.id},
          ${accountsReceivable.invoiceId},
          ${accountsReceivable.agencyName},
          ${accountsReceivable.agencyCNPJ},
          ${accountsReceivable.amount},
          ${accountsReceivable.currency},
          ${accountsReceivable.dueDate},
          ${accountsReceivable.paymentDate},
          ${accountsReceivable.status},
          DATEDIFF(${accountsReceivable.dueDate}, NOW()) as daysUntilDue
        FROM ${accountsReceivable}
        WHERE ${accountsReceivable.createdAt} >= ${cutoffDate}
        ORDER BY ${accountsReceivable.dueDate} ASC
      `
    ) as any;

    return arData || [];
  } catch (error) {
    console.error("[Database] Failed to get accounts receivable:", error);
    return null;
  }
}

export async function getAPSummary() {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get AP summary: database not available");
    return null;
  }

  try {
    const summary = await db.execute(
      sql`
        SELECT 
          COUNT(*) as totalRecords,
          SUM(CASE WHEN ${accountsPayable.status} = 'pending' THEN 1 ELSE 0 END) as pendingCount,
          SUM(CASE WHEN ${accountsPayable.status} = 'overdue' THEN 1 ELSE 0 END) as overdueCount,
          SUM(CASE WHEN ${accountsPayable.status} = 'paid' THEN 1 ELSE 0 END) as paidCount,
          SUM(CASE WHEN ${accountsPayable.status} = 'pending' THEN ${accountsPayable.amount} ELSE 0 END) as totalPending,
          SUM(CASE WHEN ${accountsPayable.status} = 'overdue' THEN ${accountsPayable.amount} ELSE 0 END) as totalOverdue
        FROM ${accountsPayable}
      `
    ) as any;

    return summary?.[0] || null;
  } catch (error) {
    console.error("[Database] Failed to get AP summary:", error);
    return null;
  }
}

export async function getARSummary() {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get AR summary: database not available");
    return null;
  }

  try {
    const summary = await db.execute(
      sql`
        SELECT 
          COUNT(*) as totalRecords,
          SUM(CASE WHEN ${accountsReceivable.status} = 'pending' THEN 1 ELSE 0 END) as pendingCount,
          SUM(CASE WHEN ${accountsReceivable.status} = 'overdue' THEN 1 ELSE 0 END) as overdueCount,
          SUM(CASE WHEN ${accountsReceivable.status} = 'paid' THEN 1 ELSE 0 END) as paidCount,
          SUM(CASE WHEN ${accountsReceivable.status} = 'pending' THEN ${accountsReceivable.amount} ELSE 0 END) as totalPending,
          SUM(CASE WHEN ${accountsReceivable.status} = 'overdue' THEN ${accountsReceivable.amount} ELSE 0 END) as totalOverdue
        FROM ${accountsReceivable}
      `
    ) as any;

    return summary?.[0] || null;
  } catch (error) {
    console.error("[Database] Failed to get AR summary:", error);
    return null;
  }
}

export async function getFinancialAnalysisByInvoice(invoiceId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get financial analysis: database not available");
    return null;
  }

  try {
    const analysis = await db.execute(
      sql`
        SELECT * FROM ${financialAnalysis}
        WHERE ${financialAnalysis.invoiceId} = ${invoiceId}
      `
    ) as any;

    return analysis?.[0] || null;
  } catch (error) {
    console.error("[Database] Failed to get financial analysis:", error);
    return null;
  }
}


/**
 * Authentication Functions
 */

export async function hashPassword(password: string): Promise<string> {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const passwordHash = await hashPassword(password);
  return passwordHash === hash;
}

export async function generateResetToken(): Promise<string> {
  return crypto.randomBytes(32).toString('hex');
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).where(eq(users.email, email)).limit(1);
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).where(eq(users.id, id)).limit(1);
}

export async function createPasswordResetToken(userId: number, expiresInHours: number = 24) {
  const db = await getDb();
  if (!db) return null;
  
  const token = await generateResetToken();
  const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);
  
  return db.insert(passwordResetTokens).values({
    userId,
    token,
    expiresAt,
  });
}

export async function getValidPasswordResetToken(token: string) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db
    .select()
    .from(passwordResetTokens)
    .where(
      and(
        eq(passwordResetTokens.token, token),
        gt(passwordResetTokens.expiresAt, new Date()),
        isNull(passwordResetTokens.usedAt)
      )
    )
    .limit(1);
  
  return result[0] || null;
}

export async function markPasswordResetTokenAsUsed(tokenId: number) {
  const db = await getDb();
  if (!db) return null;
  
  return db
    .update(passwordResetTokens)
    .set({ usedAt: new Date() })
    .where(eq(passwordResetTokens.id, tokenId));
}

export async function updateUserPassword(userId: number, passwordHash: string) {
  const db = await getDb();
  if (!db) return null;
  
  return db
    .update(users)
    .set({ 
      passwordHash,
      localAuthEnabled: 1,
    })
    .where(eq(users.id, userId));
}

export async function getUserPermissions(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db
    .select({ permission: userPermissions.permission })
    .from(userPermissions)
    .where(eq(userPermissions.userId, userId));
}

export async function hasPermission(userId: number, permission: string): Promise<boolean> {
  const user = await getUserById(userId);
  if (!user || !user[0]) return false;
  
  // admin_master has all permissions
  if (user[0].role === 'admin_master') return true;
  
  // Check specific permissions
  const permissions = await getUserPermissions(userId);
  return permissions.some((p: any) => p.permission === permission);
}
