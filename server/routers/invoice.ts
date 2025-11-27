import { z } from 'zod';
import { protectedProcedure, router } from '../_core/trpc';
import { extractInvoiceFromPDF } from '../pdf-extractor';
import {
  createInvoiceWithTickets,
  getInvoiceWithTickets,
  listInvoices,
  updateInvoiceDetails,
  updateInvoiceStatus,
  deleteInvoice,
  searchInvoices,
} from '../invoice-db';
import { uploadPDFFile, uploadAttachmentFile, getFileUrl } from '../file-storage';

export const invoiceRouter = router({
  /**
   * Upload and process a PDF file
   */
  uploadPDF: protectedProcedure
    .input(
      z.object({
        file: z.instanceof(Uint8Array),
        filename: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        // Convert Uint8Array to Buffer
        const fileBuffer = Buffer.from(input.file);
        
        // Upload PDF to storage
        const { url: pdfUrl, key: pdfKey } = await uploadPDFFile(
          fileBuffer,
          input.filename,
          ctx.user.id
        );

        // Extract data from PDF
        const extractedData = await extractInvoiceFromPDF(fileBuffer, input.filename);

        // Update invoice with PDF path
        extractedData.invoice.pdfPath = pdfKey;

        // Save to database
        const result = await createInvoiceWithTickets(
          extractedData.invoice,
          extractedData.tickets,
          extractedData.airlineOperations
        );

        return {
          success: true,
          invoice: result.invoice,
          ticketCount: result.tickets.length,
          operationCount: result.operations.length,
          pdfUrl,
        };
      } catch (error) {
        console.error('Error uploading PDF:', error);
        throw new Error('Failed to process PDF file');
      }
    }),

  /**
   * Get invoice details with all related data
   */
  getInvoice: protectedProcedure
    .input(z.object({ invoiceId: z.string() }))
    .query(async ({ input }) => {
      try {
        const result = await getInvoiceWithTickets(input.invoiceId);
        if (!result) {
          throw new Error('Invoice not found');
        }

        // Get PDF URL if available
        let pdfUrl: string | null = null;
        if (result.invoice && result.invoice.pdfPath) {
          try {
            pdfUrl = await getFileUrl(result.invoice.pdfPath);
          } catch (error) {
            console.error('Error getting PDF URL:', error);
          }
        }

        return {
          invoice: result.invoice,
          tickets: result.tickets,
          operations: result.operations,
          details: result.details,
          pdfUrl,
        };
      } catch (error) {
        console.error('Error fetching invoice:', error);
        throw new Error('Failed to fetch invoice');
      }
    }),

  /**
   * List all invoices with pagination
   */
  listInvoices: protectedProcedure
    .input(
      z.object({
        limit: z.number().default(20),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input }) => {
      try {
        const invoices = await listInvoices(input.limit, input.offset);
        return invoices;
      } catch (error) {
        console.error('Error listing invoices:', error);
        throw new Error('Failed to list invoices');
      }
    }),

  /**
   * Search invoices by client name or CNPJ
   */
  searchInvoices: protectedProcedure
    .input(z.object({ query: z.string() }))
    .query(async ({ input }) => {
      try {
        const results = await searchInvoices(input.query);
        return results;
      } catch (error) {
        console.error('Error searching invoices:', error);
        throw new Error('Failed to search invoices');
      }
    }),

  /**
   * Update invoice details (client name, notes, etc.)
   */
  updateDetails: protectedProcedure
    .input(
      z.object({
        invoiceId: z.string(),
        finalClientName: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const result = await updateInvoiceDetails(input.invoiceId, {
          finalClientName: input.finalClientName,
          notes: input.notes,
        });
        return result;
      } catch (error) {
        console.error('Error updating invoice details:', error);
        throw new Error('Failed to update invoice details');
      }
    }),

  /**
   * Upload attachment (voucher or billet)
   */
  uploadAttachment: protectedProcedure
    .input(
      z.object({
        invoiceId: z.string(),
        file: z.instanceof(Uint8Array),
        filename: z.string(),
        type: z.enum(['voucher', 'billet']),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const fileBuffer = Buffer.from(input.file);
        const { url, key } = await uploadAttachmentFile(
          fileBuffer,
          input.filename,
          input.invoiceId,
          input.type
        );

        // Update invoice details with attachment path
        const fieldName = input.type === 'voucher' ? 'voucherPath' : 'billetPath';
        await updateInvoiceDetails(input.invoiceId, {
          [fieldName]: key,
        });

        return {
          success: true,
          url,
          key,
          type: input.type,
        };
      } catch (error) {
        console.error('Error uploading attachment:', error);
        throw new Error('Failed to upload attachment');
      }
    }),

  /**
   * Update invoice validation status
   */
  updateStatus: protectedProcedure
    .input(
      z.object({
        invoiceId: z.string(),
        status: z.enum(['valid', 'warning', 'error', 'pending']),
      })
    )
    .mutation(async ({ input }) => {
      try {
        await updateInvoiceStatus(input.invoiceId, input.status);
        return { success: true };
      } catch (error) {
        console.error('Error updating invoice status:', error);
        throw new Error('Failed to update invoice status');
      }
    }),

  /**
   * Delete invoice
   */
  deleteInvoice: protectedProcedure
    .input(z.object({ invoiceId: z.string() }))
    .mutation(async ({ input }) => {
      try {
        await deleteInvoice(input.invoiceId);
        return { success: true };
      } catch (error) {
        console.error('Error deleting invoice:', error);
        throw new Error('Failed to delete invoice');
      }
    }),
});
