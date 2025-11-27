import { PDFParse } from 'pdf-parse';
import { InsertSalesInvoice, InsertSalesTicket, InsertAirlineOperation } from '../drizzle/schema';

export interface ExtractedInvoiceData {
  invoice: InsertSalesInvoice;
  tickets: InsertSalesTicket[];
  airlineOperations: InsertAirlineOperation[];
  rawText: string;
}

/**
 * Extract text content from a PDF file
 */
export async function extractTextFromPDF(pdfBuffer: Buffer): Promise<string> {
  try {
    // Convert buffer to file:// URL by writing to temp location
    const base64 = pdfBuffer.toString('base64');
    const dataUrl = `data:application/pdf;base64,${base64}`;
    
    // Use file URL approach - write to temp and read
    const fs = await import('fs').then(m => m.promises);
    const path = await import('path');
    const os = await import('os');
    
    const tempDir = os.tmpdir();
    const tempFile = path.join(tempDir, `pdf-${Date.now()}.pdf`);
    
    await fs.writeFile(tempFile, pdfBuffer);
    
    const parser = new PDFParse({ url: `file://${tempFile}` });
    const result = await parser.getText();
    
    // Clean up temp file
    try {
      await fs.unlink(tempFile);
    } catch (e) {
      // Ignore cleanup errors
    }
    
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
  const result: Partial<InsertSalesInvoice> = {};

  // Extract agency name (first line with company name)
  const lines = text.split('\n');
  if (lines.length > 0) {
    result.agencyName = lines[0].trim();
  }

  // Extract agency CNPJ (pattern: XX.XXX.XXX/XXXX-XX)
  const cnpjPattern = /CNPJ:\s*(\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2})/i;
  const cnpjMatch = text.match(cnpjPattern);
  if (cnpjMatch) {
    result.agencyCNPJ = cnpjMatch[1];
  }

  // Extract agency address
  const addressPattern = /ALAMEDA\s+([^\n]+)|RUA\s+([^\n]+)|AV\.\s+([^\n]+)/i;
  const addressMatch = text.match(addressPattern);
  if (addressMatch) {
    result.agencyAddress = (addressMatch[1] || addressMatch[2] || addressMatch[3]).trim();
  }

  // Extract agency email
  const emailPattern = /E-Mail:\s*([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/i;
  const emailMatch = text.match(emailPattern);
  if (emailMatch) {
    result.agencyEmail = emailMatch[1];
  }

  // Extract client name
  const clientPattern = /Cliente:\s*([^\n]+)/i;
  const clientMatch = text.match(clientPattern);
  if (clientMatch) {
    result.clientName = clientMatch[1].trim();
  }

  // Extract client CNPJ
  const clientCnpjPattern = /C\.N\.P\.J\.:\s*(\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2})/;
  const clientCnpjMatch = text.match(clientCnpjPattern);
  if (clientCnpjMatch) {
    result.clientCNPJ = clientCnpjMatch[1];
  }

  // Extract client address
  const clientAddressPattern = /Endereço:\s*([^\n]+)/i;
  const clientAddressMatch = text.match(clientAddressPattern);
  if (clientAddressMatch) {
    result.clientAddress = clientAddressMatch[1].trim();
  }

  // Extract client city
  const cityPattern = /Cidade:\s*([^\t\n]+)/i;
  const cityMatch = text.match(cityPattern);
  if (cityMatch) {
    result.clientCity = cityMatch[1].trim();
  }

  // Extract client state
  const statePattern = /Estado:\s*([A-Z]{2})/;
  const stateMatch = text.match(statePattern);
  if (stateMatch) {
    result.clientState = stateMatch[1];
  }

  // Extract client ZIP
  const zipPattern = /CEP:\s*(\d{5}-\d{3})/;
  const zipMatch = text.match(zipPattern);
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
  const ciaPattern = /Cia:\s*([A-Z]{2})\s+Emissao:\s*([^\t]+)\s+Tipo:\s*([^\n]+)/g;
  let ciaMatch;

  while ((ciaMatch = ciaPattern.exec(text)) !== null) {
    const airline = ciaMatch[1];
    const saleType = ciaMatch[3].trim();

    // Find the section between this Cia and the next one or TOTAL
    const startIdx = ciaMatch.index + ciaMatch[0].length;
    const nextCiaIdx = text.indexOf('Cia:', startIdx);
    const totalIdx = text.indexOf('TOTAL GERAL', startIdx);
    let endIdx = text.length;
    
    if (nextCiaIdx !== -1) endIdx = Math.min(endIdx, nextCiaIdx);
    if (totalIdx !== -1) endIdx = Math.min(endIdx, totalIdx);
    
    const section = text.substring(startIdx, endIdx);

    // Parse individual ticket rows
    // Pattern: PASSENGER_NAME ROUTE DATE TKT/LOC TARIFF TAX ... LIQUIDO TXDU
    const lines = section.split('\n');
    
    for (const line of lines) {
      // Skip header and total lines
      if (line.includes('Passageiro') || line.includes('TOTAL DA CIA') || line.trim() === '') {
        continue;
      }

      // Try to parse the line as a ticket
      const ticket = parseTicketLine(line, airline, saleType, invoiceId);
      if (ticket) {
        tickets.push(ticket);
      }
    }
  }

  return tickets;
}

/**
 * Parse a single ticket line
 */
function parseTicketLine(
  line: string,
  airline: string,
  saleType: string,
  invoiceId: string
): InsertSalesTicket | null {
  // Trim and check if line has enough content
  const trimmed = line.trim();
  if (!trimmed || trimmed.length < 20) return null;

  try {
    // Split by multiple spaces/tabs to get fields
    const fields = trimmed.split(/\s{2,}|\t+/).filter(f => f.trim());
    
    if (fields.length < 8) return null;

    // Extract passenger name (first field, may contain multiple words)
    const passengerName = fields[0];
    
    // Find numeric fields (tariff, tax, etc.)
    const numericFields = fields.slice(1).map(f => {
      // Parse currency format (1.234,56 or 1234,56)
      const cleanedValue = f.replace(/\./g, '').replace(',', '.');
      return parseFloat(cleanedValue) || 0;
    });

    if (numericFields.length < 7) return null;

    const ticket: InsertSalesTicket = {
      invoiceId,
      passengerName: passengerName.trim(),
      emissionDate: new Date().toLocaleDateString('pt-BR'),
      ticketNumber: fields[1] || 'N/A',
      airline,
      saleType,
      tariff: Math.round(numericFields[0] * 100),
      tax: Math.round(numericFields[1] * 100),
      cardRAV: Math.round(numericFields[2] * 100),
      commission: Math.round(numericFields[3] * 100),
      incentive: Math.round(numericFields[4] * 100),
      discount: Math.round(numericFields[5] * 100),
      taxAmount: Math.round(numericFields[6] * 100),
      fee: numericFields[7] ? Math.round(numericFields[7] * 100) : 0,
      adminFee: numericFields[8] ? Math.round(numericFields[8] * 100) : 0,
      netAmount: numericFields[9] ? Math.round(numericFields[9] * 100) : 0,
      duTax: numericFields[10] ? Math.round(numericFields[10] * 100) : 0,
    };

    return ticket;
  } catch (error) {
    return null;
  }
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
 * Parse airline operations from extracted text
 * Extracts data from tables organized by airline with columns:
 * Passageiro, Rota, Emissão, TKT/LOC, Tarifa R$, Taxa, Cartão/RAV, Comissão, Incentivo, Desconto, Imposto, Fee, TxAdmCt, Líquido, TxDU, Obs
 */
function parseAirlineOperations(text: string, invoiceId: string): InsertAirlineOperation[] {
  const operations: InsertAirlineOperation[] = [];
  
  // Split text into lines
  const lines = text.split('\n');
  
  let currentAirline = '';
  let inOperationsTable = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines
    if (!line) continue;
    
    // Look for airline section headers (e.g., "CIA: AD" or "Cia: AD")
    const airlineMatch = line.match(/(?:CIA|Cia)\s*:\s*([A-Z]{2})/i);
    if (airlineMatch) {
      currentAirline = airlineMatch[1].toUpperCase();
      inOperationsTable = true;
      continue;
    }
    
    // Look for table headers containing "Passageiro"
    if (line.includes('Passageiro') && line.includes('Rota')) {
      inOperationsTable = true;
      continue;
    }
    
    // Skip total lines
    if (line.includes('TOTAL DA CIA') || line.includes('TOTAL')) {
      inOperationsTable = false;
      continue;
    }
    
    // Parse data lines - must have airline and be in table
    if (inOperationsTable && currentAirline && line.length > 30) {
      const operation = parseAirlineOperationLine(line, currentAirline, invoiceId);
      if (operation) {
        operations.push(operation);
      }
    }
  }
  
  return operations;
}

/**
 * Parse a single airline operation line
 * Expected format: Passageiro | Rota | Emissão | TKT/LOC | Tarifa | Taxa | Cartão/RAV | Comissão | Incentivo | Desconto | Imposto | Fee | TxAdmCt | Líquido | TxDU | Obs
 */
function parseAirlineOperationLine(
  line: string,
  airline: string,
  invoiceId: string
): InsertAirlineOperation | null {
  try {
    // Split by multiple spaces/tabs
    const fields = line.split(/\s{2,}|\t+/).filter(f => f.trim());
    
    // Need at least: Passageiro, Rota, Emissão, TKT/LOC, Tarifa, Taxa, Cartão/RAV, Comissão, Incentivo, Desconto, Imposto, Fee, TxAdmCt, Líquido, TxDU
    if (fields.length < 15) return null;
    
    // Helper function to parse currency
    const parseCurrency = (value: string): number => {
      if (!value || value.trim() === '') return 0;
      // Remove dots (thousands separator) and replace comma with dot
      const cleaned = value.replace(/\./g, '').replace(',', '.');
      return Math.round(parseFloat(cleaned) * 100) || 0;
    };
    
    const operation: InsertAirlineOperation = {
      invoiceId,
      airline,
      passengerName: fields[0] || '',
      route: fields[1] || '',
      emissionDate: fields[2] || '',
      ticketNumber: fields[3] || '',
      tariff: parseCurrency(fields[4]),
      tax: parseCurrency(fields[5]),
      cardRAV: parseCurrency(fields[6]),
      commission: parseCurrency(fields[7]),
      incentive: parseCurrency(fields[8]),
      discount: parseCurrency(fields[9]),
      taxAmount: parseCurrency(fields[10]),
      fee: parseCurrency(fields[11]),
      adminFee: parseCurrency(fields[12]),
      netAmount: parseCurrency(fields[13]),
      duTax: parseCurrency(fields[14]),
      observation: fields[15] || undefined,
    };
    
    return operation;
  } catch (error) {
    return null;
  }
}

/**
 * Extract invoice ID from text or filename
 */
function extractInvoiceId(text: string, filename?: string): string {
  // Try to extract from filename first (pattern like FTS-SAO00402220250715)
  if (filename) {
    // Remove .pdf extension if present
    const nameWithoutExt = filename.replace(/\.pdf$/i, '');
    // Match pattern: FTS-SAO00402220250715 (3 letters, dash, 3 letters, followed by digits)
    const match = nameWithoutExt.match(/([A-Z]{3}-[A-Z]{3}\d+)/);
    if (match) return match[1];
  }

  // Try to find in text - pattern: FTS-SAO00402220250715
  const match = text.match(/([A-Z]{3}-[A-Z]{3}\d+)/);
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

    if (!rawText || rawText.trim().length === 0) {
      throw new Error('PDF appears to be empty or unreadable');
    }

    // Extract invoice ID
    const invoiceId = extractInvoiceId(rawText, filename);

    // Parse header information
    const headerData = parseInvoiceHeader(rawText);

    // Parse tickets
    const tickets = parseTickets(rawText, invoiceId);

    // Parse airline operations
    const airlineOperations = parseAirlineOperations(rawText, invoiceId);

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
      airlineOperations,
      rawText,
    };
  } catch (error) {
    console.error('Error extracting invoice from PDF:', error);
    throw error;
  }
}
