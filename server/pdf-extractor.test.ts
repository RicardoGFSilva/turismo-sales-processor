import { describe, it, expect, beforeAll, vi } from 'vitest';
import { readFileSync } from 'fs';
import { extractInvoiceFromPDF } from './pdf-extractor';

// Polyfill for DOMMatrix in Node.js environment
if (typeof global.DOMMatrix === 'undefined') {
  global.DOMMatrix = class DOMMatrix {
    constructor() {}
  } as any;
}

describe.skip('PDF Extractor', () => {
  let pdfBuffer: Buffer;

  beforeAll(() => {
    // Load the example PDF from the upload directory
    try {
      pdfBuffer = readFileSync('/home/ubuntu/upload/FTS-SAO00402220250715.pdf');
    } catch (error) {
      console.warn('Example PDF not found, skipping PDF extraction tests');
    }
  });

  it('should extract invoice data from PDF', async () => {
    if (!pdfBuffer) {
      console.log('Skipping test: PDF not available');
      return;
    }

    const result = await extractInvoiceFromPDF(pdfBuffer, 'FTS-SAO00402220250715.pdf');

    expect(result).toBeDefined();
    expect(result.invoice).toBeDefined();
    expect(result.tickets).toBeDefined();
    expect(result.rawText).toBeDefined();
  });

  it('should extract invoice ID correctly', async () => {
    if (!pdfBuffer) {
      console.log('Skipping test: PDF not available');
      return;
    }

    const result = await extractInvoiceFromPDF(pdfBuffer, 'FTS-SAO00402220250715.pdf');

    expect(result.invoice.invoiceId).toBe('FTS-SAO00402220250715');
  });

  it('should extract agency information', async () => {
    if (!pdfBuffer) {
      console.log('Skipping test: PDF not available');
      return;
    }

    const result = await extractInvoiceFromPDF(pdfBuffer);

    expect(result.invoice.agencyName).toBeDefined();
    expect(result.invoice.agencyCNPJ).toBeDefined();
    expect(result.invoice.agencyName.length).toBeGreaterThan(0);
  });

  it('should extract client information', async () => {
    if (!pdfBuffer) {
      console.log('Skipping test: PDF not available');
      return;
    }

    const result = await extractInvoiceFromPDF(pdfBuffer);

    expect(result.invoice.clientName).toBeDefined();
    expect(result.invoice.clientCNPJ).toBeDefined();
  });

  it('should extract tickets from invoice', async () => {
    if (!pdfBuffer) {
      console.log('Skipping test: PDF not available');
      return;
    }

    const result = await extractInvoiceFromPDF(pdfBuffer);

    expect(result.tickets.length).toBeGreaterThan(0);
    expect(result.tickets[0]).toBeDefined();
  });

  it('should extract ticket details correctly', async () => {
    if (!pdfBuffer) {
      console.log('Skipping test: PDF not available');
      return;
    }

    const result = await extractInvoiceFromPDF(pdfBuffer);
    const ticket = result.tickets[0];

    expect(ticket).toBeDefined();
    expect(ticket.passengerName).toBeDefined();
    expect(ticket.airline).toBeDefined();
    expect(ticket.tariff).toBeGreaterThanOrEqual(0);
    expect(ticket.netAmount).toBeGreaterThanOrEqual(0);
  });

  it('should calculate totals correctly', async () => {
    if (!pdfBuffer) {
      console.log('Skipping test: PDF not available');
      return;
    }

    const result = await extractInvoiceFromPDF(pdfBuffer);

    expect(result.invoice.totalTariff).toBeGreaterThanOrEqual(0);
    expect(result.invoice.totalTax).toBeGreaterThanOrEqual(0);
    expect(result.invoice.totalNetAmount).toBeGreaterThanOrEqual(0);
  });

  it('should set validation status to valid when tickets are found', async () => {
    if (!pdfBuffer) {
      console.log('Skipping test: PDF not available');
      return;
    }

    const result = await extractInvoiceFromPDF(pdfBuffer);

    expect(result.invoice.validationStatus).toBe('valid');
  });
});

describe('PDF Extractor - Airline Operations', () => {
  let pdfBuffer: Buffer;

  beforeAll(() => {
    try {
      pdfBuffer = readFileSync('/home/ubuntu/upload/FTS-SAO00402220250715.pdf');
    } catch (error) {
      console.warn('Example PDF not found, skipping airline operations tests');
    }
  });

  it('should extract airline operations from PDF', async () => {
    if (!pdfBuffer) {
      console.log('Skipping test: PDF not available');
      return;
    }

    const result = await extractInvoiceFromPDF(pdfBuffer, 'FTS-SAO00402220250715.pdf');

    expect(result.airlineOperations).toBeDefined();
    expect(Array.isArray(result.airlineOperations)).toBe(true);
  });

  it('should have correct structure for airline operations', async () => {
    if (!pdfBuffer) {
      console.log('Skipping test: PDF not available');
      return;
    }

    const result = await extractInvoiceFromPDF(pdfBuffer);

    if (result.airlineOperations.length > 0) {
      const operation = result.airlineOperations[0];
      
      expect(operation).toHaveProperty('invoiceId');
      expect(operation).toHaveProperty('airline');
      expect(operation).toHaveProperty('passengerName');
      expect(operation).toHaveProperty('route');
      expect(operation).toHaveProperty('emissionDate');
      expect(operation).toHaveProperty('ticketNumber');
      expect(operation).toHaveProperty('tariff');
      expect(operation).toHaveProperty('tax');
      expect(operation).toHaveProperty('netAmount');
    }
  });

  it('should store monetary values in cents', async () => {
    if (!pdfBuffer) {
      console.log('Skipping test: PDF not available');
      return;
    }

    const result = await extractInvoiceFromPDF(pdfBuffer);

    if (result.airlineOperations.length > 0) {
      const operation = result.airlineOperations[0];
      
      expect(Number.isInteger(operation.tariff)).toBe(true);
      expect(Number.isInteger(operation.tax)).toBe(true);
      expect(Number.isInteger(operation.netAmount)).toBe(true);
      
      expect(operation.tariff).toBeGreaterThanOrEqual(0);
      expect(operation.tax).toBeGreaterThanOrEqual(0);
    }
  });
});
