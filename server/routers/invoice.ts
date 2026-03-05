import { z } from 'zod';
import { protectedProcedure, router } from '../_core/trpc';
import { extractInvoiceFromPDF } from '../pdf-extractor';
import {
  createInvoiceWithTickets,
  getInvoiceWithTickets,
  listInvoices as getAllInvoices,
  updateInvoiceDetails,
  updateInvoiceStatus,
  deleteInvoice,
  searchInvoices,
} from '../invoice-db';
import { uploadPDFFile, uploadAttachmentFile, getFileUrl } from '../file-storage';
import { validateInvoice, validateCNPJ, validateMonetaryValue } from '../validators';

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

        // Validate extracted data
        const validationResult = validateInvoice({
          invoiceId: extractedData.invoice.invoiceId,
          agencyName: extractedData.invoice.agencyName,
          agencyCNPJ: extractedData.invoice.agencyCNPJ,
          clientName: extractedData.invoice.clientName,
          clientCNPJ: extractedData.invoice.clientCNPJ,
          tickets: extractedData.tickets.map(t => ({
            passengerName: t.passengerName,
            route: t.route,
            airline: t.airline,
            tariff: t.tariff,
            tax: t.tax,
          })),
        });

        if (!validationResult.isValid) {
          console.error('Validation errors:', validationResult.errors);
          throw new Error(`Dados inválidos: ${validationResult.errors.join('; ')}`);
        }

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
        
        // Provide user-friendly error messages
        if (error instanceof Error) {
          if (error.message.includes('ja existe')) {
            throw new Error(error.message);
          }
          if (error.message.includes('Failed to extract')) {
            throw new Error('Nao foi possivel extrair dados do PDF. Verifique se o arquivo eh valido.');
          }
        }
        
        throw new Error('Falha ao processar arquivo PDF. Tente novamente.');
      }
    }),

  /**
   * Get invoice details with all related data
   */
  getInvoice: protectedProcedure
    .input(z.object({ invoiceId: z.string().min(1, 'Invoice ID is required') }))
    .query(async ({ input }) => {
      try {
        console.log('[getInvoice] Received invoiceId:', input.invoiceId);
        console.log('[getInvoice] invoiceId type:', typeof input.invoiceId);
        console.log('[getInvoice] invoiceId length:', input.invoiceId.length);
        
        const result = await getInvoiceWithTickets(input.invoiceId);
        console.log('[getInvoice] Result from getInvoiceWithTickets:', result ? 'Found' : 'Not found');
        
        if (!result) {
          console.error('[getInvoice] Invoice not found for id:', input.invoiceId);
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
        const invoices = await getAllInvoices(input.limit, input.offset);
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
        // Validate finalClientName if provided
        if (input.finalClientName) {
          if (input.finalClientName.trim().length === 0) {
            throw new Error('Nome do cliente não pode estar vazio');
          }
          if (input.finalClientName.length > 200) {
            throw new Error('Nome do cliente não pode exceder 200 caracteres');
          }
        }

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
   * Update invoice validation status with automatic validation
   */
  updateStatus: protectedProcedure
    .input(
      z.object({
        invoiceId: z.string(),
        status: z.enum(['valid', 'warning', 'error', 'pending']).optional(),
        autoValidate: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        let status = input.status || 'pending';

        // If autoValidate is true, fetch invoice and validate it
        if (input.autoValidate) {
          const invoice = await getInvoiceWithTickets(input.invoiceId);
          if (!invoice || !invoice.invoice) {
            throw new Error('Invoice not found');
          }

          const validationResult = validateInvoice({
            invoiceId: invoice.invoice.invoiceId,
            agencyName: invoice.invoice.agencyName,
            agencyCNPJ: invoice.invoice.agencyCNPJ,
            clientName: invoice.invoice.clientName,
            clientCNPJ: invoice.invoice.clientCNPJ,
            tickets: invoice.tickets.map(t => ({
              passengerName: t.passengerName,
              route: t.route,
              airline: t.airline,
              tariff: t.tariff,
              tax: t.tax,
            })),
          });

          status = validationResult.isValid ? 'valid' : 'error';
          console.log('[updateStatus] Auto-validation result:', {
            isValid: validationResult.isValid,
            errors: validationResult.errors,
          });
        }

        await updateInvoiceStatus(input.invoiceId, status);
        return { success: true, status };
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

  /**
   * Validate invoice data
   */
  validateInvoiceData: protectedProcedure
    .input(
      z.object({
        invoiceId: z.string(),
      })
    )
    .query(async ({ input }) => {
      try {
        const invoice = await getInvoiceWithTickets(input.invoiceId);
        if (!invoice || !invoice.invoice) {
          throw new Error('Invoice not found');
        }

        const validationResult = validateInvoice({
          invoiceId: invoice.invoice.invoiceId,
          agencyName: invoice.invoice.agencyName,
          agencyCNPJ: invoice.invoice.agencyCNPJ,
          clientName: invoice.invoice.clientName,
          clientCNPJ: invoice.invoice.clientCNPJ,
          tickets: invoice.tickets.map(t => ({
            passengerName: t.passengerName,
            route: t.route,
            airline: t.airline,
            tariff: t.tariff,
            tax: t.tax,
          })),
        });

        return {
          isValid: validationResult.isValid,
          errors: validationResult.errors,
        };
      } catch (error) {
        console.error('Error validating invoice:', error);
        throw new Error('Failed to validate invoice');
      }
    }),
});
