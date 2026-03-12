import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users } from "../drizzle/schema";
import { ENV } from './_core/env';

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
