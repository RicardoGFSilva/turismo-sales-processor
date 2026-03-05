import type { InsertSalesInvoice, InsertSalesTicket } from '../drizzle/schema';

export interface ParsedInvoice {
  invoiceId: string;
  agencyName: string;
  agencyCNPJ: string;
  clientName: string;
  clientCNPJ: string;
  tickets: ParsedTicket[];
  totals: {
    tariff: number;
    tax: number;
    netAmount: number;
  };
}

interface ParsedTicket {
  passengerName: string;
  route: string;
  airline: string;
  tariff: number;
  tax: number;
  netAmount: number;
}

/**
 * Parse invoice data from extracted PDF text
 */
export function parseInvoiceFromText(text: string): ParsedInvoice {
  console.log('[Parser] Starting invoice parsing...');

  const invoiceId = extractInvoiceId(text);
  const agencyName = extractAgencyName(text);
  const agencyCNPJ = extractAgencyCNPJ(text);
  const clientName = extractClientName(text);
  const clientCNPJ = extractClientCNPJ(text);
  const tickets = parseTicketsFromText(text);
  const totals = calculateTotals(tickets);

  const result: ParsedInvoice = {
    invoiceId,
    agencyName,
    agencyCNPJ,
    clientName,
    clientCNPJ,
    tickets,
    totals,
  };

  console.log('[Parser] Invoice parsing complete:', {
    invoiceId,
    agencyName,
    clientName,
    ticketCount: tickets.length,
    totals,
  });

  return result;
}

/**
 * Extract invoice ID from filename or document
 */
function extractInvoiceId(text: string): string {
  let match = text.match(/FTS-[A-Z0-9]+/);
  if (match) {
    const id = match[0];
    console.log('[Parser] Invoice ID found in text:', id);
    return id;
  }

  const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
  const id = `FTS-SAO${timestamp}`;
  console.log('[Parser] Invoice ID generated:', id);
  return id;
}

/**
 * Extract agency name
 */
function extractAgencyName(text: string): string {
  const match = text.match(/FLYTOUR[^\n]*/);
  if (match) {
    return match[0].trim();
  }
  return '';
}

/**
 * Extract agency CNPJ (first CNPJ in document)
 */
function extractAgencyCNPJ(text: string): string {
  const matches = text.match(/\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}/g);
  return matches ? matches[0] : '';
}

/**
 * Extract client name
 */
function extractClientName(text: string): string {
  const match = text.match(/Cliente:\s*([^\n]+)/);
  if (match) {
    return match[1].trim();
  }
  return '';
}

/**
 * Extract client CNPJ (second CNPJ in document)
 */
function extractClientCNPJ(text: string): string {
  const matches = text.match(/\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}/g);
  return matches && matches.length > 1 ? matches[1] : '';
}

/**
 * Parse all tickets from text
 * Strategy: Find lines with airline codes and monetary values, then search backwards for passenger and route
 */
function parseTicketsFromText(text: string): ParsedTicket[] {
  const tickets: ParsedTicket[] = [];
  const lines = text.split('\n');

  console.log('[Parser] Scanning', lines.length, 'lines for tickets');

  // Clean lines: trim and filter out empty lines and headers
  const cleanLines = lines
    .map(l => l.trim())
    .filter(l => l && !l.includes('Cia:') && !l.includes('Passageiro') && !l.includes('TOTAL'));

  // Find all lines that contain airline codes and monetary values
  for (let i = 0; i < cleanLines.length; i++) {
    const line = cleanLines[i];

    // Look for airline code (2 letters followed by numbers, like "LLJ22T" or "LA957531")
    const airlineMatch = line.match(/\b([A-Z]{2})\d+[A-Z]?\b/);
    if (!airlineMatch) {
      continue;
    }

    // Look for monetary values (tariff and tax)
    const valuesMatch = line.match(/(\d+[.,]\d{2})\s+(\d+[.,]\d{2})/);
    if (!valuesMatch) {
      continue;
    }

    // Found a ticket line, now search backwards for passenger and route
    let passengerName = '';
    let route = '';

    // Search backwards through previous lines
    for (let j = i - 1; j >= Math.max(0, i - 10); j--) {
      const prevLine = cleanLines[j];

      // Look for route: 3 letters / 3 letters (like REC/GIG or MAO/BEL)
      if (!route && prevLine.match(/^[A-Z]{3}\/[A-Z]{3}$/)) {
        route = prevLine;
      }

      // Look for passenger name: starts with capital letter, contains letters/spaces/slashes
      // Accept names with slashes (like "PEREIRA FARIAS/ITALO MAO/BEL")
      if (!passengerName && prevLine.match(/^[A-Z][A-Z\s\/]+$/)) {
        // Make sure it's not a company name or header
        if (!prevLine.includes('FLYTOUR') && !prevLine.includes('Relatório') && !prevLine.includes('Descrição')) {
          passengerName = prevLine;
        }
      }

      // If we found both, stop searching
      if (passengerName && route) {
        break;
      }
    }

    // If we found both passenger and route, add the ticket
    if (passengerName && route) {
      const airline = airlineMatch[1];
      const tariff = Math.round(parseFloat(valuesMatch[1].replace(',', '.')) * 100);
      const tax = Math.round(parseFloat(valuesMatch[2].replace(',', '.')) * 100);
      const netAmount = tariff + tax;

      const ticket: ParsedTicket = {
        passengerName,
        route,
        airline,
        tariff,
        tax,
        netAmount,
      };

      tickets.push(ticket);
      console.log('[Parser] Ticket parsed:', {
        passengerName,
        route,
        airline,
        tariff: tariff / 100,
        tax: tax / 100,
      });
    }
  }

  return tickets;
}

/**
 * Calculate totals from tickets
 */
function calculateTotals(tickets: ParsedTicket[]): ParsedInvoice['totals'] {
  let tariff = 0;
  let tax = 0;
  let netAmount = 0;

  for (const ticket of tickets) {
    tariff += ticket.tariff;
    tax += ticket.tax;
    netAmount += ticket.netAmount;
  }

  return {
    tariff,
    tax,
    netAmount,
  };
}
