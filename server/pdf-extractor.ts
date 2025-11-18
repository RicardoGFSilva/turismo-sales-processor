import { PDFParse } from 'pdf-parse';
import { InsertSalesInvoice, InsertSalesTicket } from '../drizzle/schema';

export interface ExtractedInvoiceData {
  invoice: InsertSalesInvoice;
  tickets: InsertSalesTicket[];
  rawText: string;
}

/**
 * Extract text content from a PDF file
 */
export async function extractTextFromPDF(pdfBuffer: Buffer): Promise<string> {
  try {
    const base64 = pdfBuffer.toString('base64');
    const dataUrl = `data:application/pdf;base64,${base64}`;
    const parser = new PDFParse({ url: dataUrl });
    const result = await parser.getText();
    return result.text || '';
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw new Error('Failed to extract text from PDF');
  }
}

/**
 * Parse invoice header information from extracted text
 */
function parseInvoiceHeader(text: string): Partial<InsertSalesInvoice> {
  const lines = text.split('\n');
  const result: Partial<InsertSalesInvoice> = {};

  // Extract agency name (usually first line with company name)
  const agencyMatch = text.match(/^([A-Z\s]+(?:LTDA|LTDA\.)?)/m);
  if (agencyMatch) {
    result.agencyName = agencyMatch[1].trim();
  }

  // Extract CNPJ (pattern: XX.XXX.XXX/XXXX-XX)
  const cnpjPattern = /(\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2})/g;
  const cnpjMatches = text.match(cnpjPattern);
  if (cnpjMatches && cnpjMatches.length >= 1) {
    result.agencyCNPJ = cnpjMatches[0];
  }
  if (cnpjMatches && cnpjMatches.length >= 2) {
    result.clientCNPJ = cnpjMatches[1];
  }

  // Extract client name
  const clientMatch = text.match(/Cliente:\s*([^\n]+)/i);
  if (clientMatch) {
    result.clientName = clientMatch[1].trim();
  }

  // Extract email
  const emailMatch = text.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/);
  if (emailMatch) {
    result.agencyEmail = emailMatch[1];
  }

  // Extract address
  const addressMatch = text.match(/(?:Endereço|Alameda|Rua):\s*([^\n]+)/i);
  if (addressMatch) {
    result.agencyAddress = addressMatch[1].trim();
  }

  // Extract client address
  const clientAddressMatch = text.match(/Cliente:[\s\S]*?Endereço:\s*([^\n]+)/i);
  if (clientAddressMatch) {
    result.clientAddress = clientAddressMatch[1].trim();
  }

  // Extract city, state, zip
  const cityMatch = text.match(/Cidade:\s*([^\n]+)/i);
  if (cityMatch) {
    result.clientCity = cityMatch[1].trim();
  }

  const stateMatch = text.match(/Estado:\s*([A-Z]{2})/i);
  if (stateMatch) {
    result.clientState = stateMatch[1];
  }

  const zipMatch = text.match(/CEP:\s*(\d{5}-\d{3})/);
  if (zipMatch) {
    result.clientZip = zipMatch[1];
  }

  return result;
}

/**
 * Parse ticket rows from extracted text
 */
function parseTickets(text: string, invoiceId: string): InsertSalesTicket[] {
  const tickets: InsertSalesTicket[] = [];

  // Split by airline company sections (Cia: XX)
  const ciaPattern = /Cia:\s*([A-Z]{2})\s+Emissao:\s*([^\n]+)\s+Tipo:\s*([^\n]+)/g;
  let ciaMatch;

  while ((ciaMatch = ciaPattern.exec(text)) !== null) {
    const airline = ciaMatch[1];
    const saleType = ciaMatch[3].trim();

    // Find the section between this Cia and the next one or end of text
    const startIdx = ciaMatch.index + ciaMatch[0].length;
    const nextCiaIdx = text.indexOf('Cia:', startIdx);
    const endIdx = nextCiaIdx !== -1 ? nextCiaIdx : text.length;
    const section = text.substring(startIdx, endIdx);

    // Parse individual ticket rows
    // Pattern: PASSENGER_NAME ROUTE DATE TKT/LOC TARIFF TAX ... LIQUIDO TXDU
    const ticketPattern = /([A-Z\s/]+?)\s+(\d{1,2}\/\d{2}\/\d{2})\s+(\d+)\s+([\d,]+)\s+([\d,]+)\s+([\d,]+)\s+([\d,]+)\s+([\d,]+)\s+([\d,]+)\s+([\d,]+)\s+([\d,]+)\s+([\d,]+)\s+([\d,]+)\s+([\d,]+)/g;

    let ticketMatch;
    while ((ticketMatch = ticketPattern.exec(section)) !== null) {
      const ticket: InsertSalesTicket = {
        invoiceId,
        passengerName: ticketMatch[1].trim(),
        emissionDate: ticketMatch[2],
        ticketNumber: ticketMatch[3],
        airline,
        saleType,
        tariff: parseMoneyToInt(ticketMatch[4]),
        tax: parseMoneyToInt(ticketMatch[5]),
        cardRAV: parseMoneyToInt(ticketMatch[6]),
        commission: parseMoneyToInt(ticketMatch[7]),
        incentive: parseMoneyToInt(ticketMatch[8]),
        discount: parseMoneyToInt(ticketMatch[9]),
        taxAmount: parseMoneyToInt(ticketMatch[10]),
        fee: parseMoneyToInt(ticketMatch[11]),
        adminFee: parseMoneyToInt(ticketMatch[12]),
        netAmount: parseMoneyToInt(ticketMatch[13]),
        duTax: parseMoneyToInt(ticketMatch[14]),
      };
      tickets.push(ticket);
    }
  }

  return tickets;
}

/**
 * Parse monetary values from string format (e.g., "1.234,56") to integer (cents)
 */
function parseMoneyToInt(value: string): number {
  if (!value || value === '0,00') return 0;
  // Remove dots (thousands separator) and replace comma with dot
  const normalized = value.replace(/\./g, '').replace(',', '.');
  return Math.round(parseFloat(normalized) * 100);
}

/**
 * Calculate totals from tickets
 */
function calculateTotals(tickets: InsertSalesTicket[]): {
  totalTariff: number;
  totalTax: number;
  totalCommission: number;
  totalIncentive: number;
  totalDiscount: number;
  totalFee: number;
  totalNetAmount: number;
} {
  return {
    totalTariff: tickets.reduce((sum, t) => sum + (t.tariff || 0), 0),
    totalTax: tickets.reduce((sum, t) => sum + (t.tax || 0), 0),
    totalCommission: tickets.reduce((sum, t) => sum + (t.commission || 0), 0),
    totalIncentive: tickets.reduce((sum, t) => sum + (t.incentive || 0), 0),
    totalDiscount: tickets.reduce((sum, t) => sum + (t.discount || 0), 0),
    totalFee: tickets.reduce((sum, t) => sum + (t.fee || 0), 0),
    totalNetAmount: tickets.reduce((sum, t) => sum + (t.netAmount || 0), 0),
  };
}

/**
 * Extract invoice ID from text (usually in filename or first lines)
 */
function extractInvoiceId(text: string, filename?: string): string {
  // Try to extract from filename first
  if (filename) {
    const match = filename.match(/([A-Z]{3}-[A-Z]{3}\d+\d{8})/);
    if (match) return match[1];
  }

  // Try to find in text (pattern like FTS-SAO00402220250715)
  const match = text.match(/([A-Z]{3}-[A-Z]{3}\d+\d{8})/);
  if (match) return match[1];

  // Fallback to timestamp-based ID
  return `INV-${Date.now()}`;
}

/**
 * Main function to extract invoice data from PDF
 */
export async function extractInvoiceFromPDF(
  pdfBuffer: Buffer,
  filename?: string
): Promise<ExtractedInvoiceData> {
  try {
    // Extract text from PDF
    const rawText = await extractTextFromPDF(pdfBuffer);

    // Extract invoice ID
    const invoiceId = extractInvoiceId(rawText, filename);

    // Parse header information
    const headerData = parseInvoiceHeader(rawText);

    // Parse tickets
    const tickets = parseTickets(rawText, invoiceId);

    // Calculate totals
    const totals = calculateTotals(tickets);

    // Create invoice object
    const invoice: InsertSalesInvoice = {
      invoiceId,
      agencyName: headerData.agencyName || 'Unknown',
      agencyCNPJ: headerData.agencyCNPJ || '',
      agencyEmail: headerData.agencyEmail,
      agencyAddress: headerData.agencyAddress,
      clientName: headerData.clientName || 'Unknown',
      clientCNPJ: headerData.clientCNPJ || '',
      clientAddress: headerData.clientAddress,
      clientCity: headerData.clientCity,
      clientState: headerData.clientState,
      clientZip: headerData.clientZip,
      pdfPath: filename,
      ...totals,
      validationStatus: tickets.length > 0 ? 'valid' : 'warning',
    };

    return {
      invoice,
      tickets,
      rawText,
    };
  } catch (error) {
    console.error('Error extracting invoice from PDF:', error);
    throw error;
  }
}
