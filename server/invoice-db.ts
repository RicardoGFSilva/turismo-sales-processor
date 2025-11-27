import { eq } from 'drizzle-orm';
import {
  salesInvoices,
  salesTickets,
  invoiceDetails,
  airlineOperations,
  InsertSalesInvoice,
  InsertSalesTicket,
  InsertInvoiceDetail,
  InsertAirlineOperation,
  SalesInvoice,
  SalesTicket,
  InvoiceDetail,
  AirlineOperation,
} from '../drizzle/schema';
import { getDb } from './db';

/**
 * Create a new invoice with its tickets and airline operations
 */
export async function createInvoiceWithTickets(
  invoice: InsertSalesInvoice,
  tickets: InsertSalesTicket[],
  operations?: InsertAirlineOperation[]
): Promise<{ invoice: SalesInvoice; tickets: SalesTicket[]; operations: AirlineOperation[] }> {
  const db = await getDb();
  if (!db) {
    throw new Error('Database not available');
  }

  try {
    // Insert invoice
    await db.insert(salesInvoices).values(invoice);

    // Insert tickets
    if (tickets.length > 0) {
      await db.insert(salesTickets).values(tickets);
    }

    // Insert airline operations
    let createdOperations: AirlineOperation[] = [];
    if (operations && operations.length > 0) {
      await db.insert(airlineOperations).values(operations);
      const fetchedOps = await db
        .select()
        .from(airlineOperations)
        .where(eq(airlineOperations.invoiceId, invoice.invoiceId));
      createdOperations = fetchedOps;
    }

    // Fetch the created records
    const createdInvoice = await db
      .select()
      .from(salesInvoices)
      .where(eq(salesInvoices.invoiceId, invoice.invoiceId))
      .limit(1);

    const createdTickets = await db
      .select()
      .from(salesTickets)
      .where(eq(salesTickets.invoiceId, invoice.invoiceId));

    return {
      invoice: createdInvoice[0]!,
      tickets: createdTickets,
      operations: createdOperations,
    };
  } catch (error) {
    console.error('Error creating invoice with tickets:', error);
    throw error;
  }
}

/**
 * Get invoice by ID with all related tickets and operations
 */
export async function getInvoiceWithTickets(invoiceId: string): Promise<{
  invoice: SalesInvoice | null;
  tickets: SalesTicket[];
  operations: AirlineOperation[];
  details: InvoiceDetail | null;
} | null> {
  const db = await getDb();
  if (!db) {
    throw new Error('Database not available');
  }

  try {
    const invoice = await db
      .select()
      .from(salesInvoices)
      .where(eq(salesInvoices.invoiceId, invoiceId))
      .limit(1);

    if (!invoice[0]) {
      return null;
    }

    const tickets = await db
      .select()
      .from(salesTickets)
      .where(eq(salesTickets.invoiceId, invoiceId));

    const operations = await db
      .select()
      .from(airlineOperations)
      .where(eq(airlineOperations.invoiceId, invoiceId));

    const details = await db
      .select()
      .from(invoiceDetails)
      .where(eq(invoiceDetails.invoiceId, invoiceId))
      .limit(1);

    return {
      invoice: invoice[0],
      tickets,
      operations,
      details: details[0] || null,
    };
  } catch (error) {
    console.error('Error fetching invoice with tickets:', error);
    throw error;
  }
}

/**
 * List all invoices with pagination
 */
export async function listInvoices(
  limit: number = 20,
  offset: number = 0
): Promise<SalesInvoice[]> {
  const db = await getDb();
  if (!db) {
    throw new Error('Database not available');
  }

  try {
    return await db
      .select()
      .from(salesInvoices)
      .limit(limit)
      .offset(offset);
  } catch (error) {
    console.error('Error listing invoices:', error);
    throw error;
  }
}

/**
 * Update invoice details (client name, notes, etc.)
 */
export async function updateInvoiceDetails(
  invoiceId: string,
  details: Partial<InsertInvoiceDetail>
): Promise<InvoiceDetail> {
  const db = await getDb();
  if (!db) {
    throw new Error('Database not available');
  }

  try {
    // Check if details record exists
    const existing = await db
      .select()
      .from(invoiceDetails)
      .where(eq(invoiceDetails.invoiceId, invoiceId))
      .limit(1);

    if (existing[0]) {
      // Update existing
      await db
        .update(invoiceDetails)
        .set({ ...details, updatedAt: new Date() })
        .where(eq(invoiceDetails.invoiceId, invoiceId));
    } else {
      // Create new
      await db.insert(invoiceDetails).values({
        invoiceId,
        ...details,
      });
    }

    // Fetch and return updated record
    const updated = await db
      .select()
      .from(invoiceDetails)
      .where(eq(invoiceDetails.invoiceId, invoiceId))
      .limit(1);

    return updated[0]!;
  } catch (error) {
    console.error('Error updating invoice details:', error);
    throw error;
  }
}

/**
 * Update invoice validation status
 */
export async function updateInvoiceStatus(
  invoiceId: string,
  status: 'valid' | 'warning' | 'error' | 'pending'
): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error('Database not available');
  }

  try {
    await db
      .update(salesInvoices)
      .set({ validationStatus: status, updatedAt: new Date() })
      .where(eq(salesInvoices.invoiceId, invoiceId));
  } catch (error) {
    console.error('Error updating invoice status:', error);
    throw error;
  }
}

/**
 * Delete invoice and all related data
 */
export async function deleteInvoice(invoiceId: string): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error('Database not available');
  }

  try {
    // Delete tickets
    await db
      .delete(salesTickets)
      .where(eq(salesTickets.invoiceId, invoiceId));

    // Delete airline operations
    await db
      .delete(airlineOperations)
      .where(eq(airlineOperations.invoiceId, invoiceId));

    // Delete details
    await db
      .delete(invoiceDetails)
      .where(eq(invoiceDetails.invoiceId, invoiceId));

    // Delete invoice
    await db
      .delete(salesInvoices)
      .where(eq(salesInvoices.invoiceId, invoiceId));
  } catch (error) {
    console.error('Error deleting invoice:', error);
    throw error;
  }
}

/**
 * Search invoices by client name or CNPJ
 */
export async function searchInvoices(query: string): Promise<SalesInvoice[]> {
  const db = await getDb();
  if (!db) {
    throw new Error('Database not available');
  }

  try {
    // Simple search - can be enhanced with full-text search
    const invoices = await db.select().from(salesInvoices);
    return invoices.filter(
      (inv) =>
        inv.clientName.toLowerCase().includes(query.toLowerCase()) ||
        inv.clientCNPJ.includes(query) ||
        inv.invoiceId.toLowerCase().includes(query.toLowerCase())
    );
  } catch (error) {
    console.error('Error searching invoices:', error);
    throw error;
  }
}
