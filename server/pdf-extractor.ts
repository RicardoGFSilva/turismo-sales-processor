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
    // Write buffer to temp file and use file:// URL
    const fs = await import('fs').then(m => m.promises);
    const path = await import('path');
    const os = await import('os');
    
    const tempDir = os.tmpdir();
    const tempFile = path.join(tempDir, `pdf-${Date.now()}.pdf`);
    
    await fs.writeFile(tempFile, pdfBuffer);
    
    try {
      const parser = new PDFParse({ url: `file://${tempFile}`, verbosity: 0 });
      const data = await parser.getText();
      return (data as any).text || '';
    } finally {
      // Clean up temp file
      try {
        await fs.unlink(tempFile);
      } catch (e) {
        // Ignore cleanup errors
      }
    }
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
  const clientAddressPattern = /Endereco:\s*([^\n]+)/i;
  const clientAddressMatch = text.match(clientAddressPattern);
  if (clientAddressMatch) {
    result.clientAddress = clientAddressMatch[1].trim();
  }

  // Extract client city
  const cityPattern = /Cidade:\s*([^\n]+)/i;
  const cityMatch = text.match(cityPattern);
  if (cityMatch) {
    result.clientCity = cityMatch[1].trim();
  }

  // Extract client state
  const statePattern = /Estado:\s*([A-Z]{2})/i;
  const stateMatch = text.match(statePattern);
  if (stateMatch) {
    result.clientState = stateMatch[1];
  }

  // Extract client zip
  const zipPattern = /CEP:\s*(\d{5}-?\d{3})/i;
  const zipMatch = text.match(zipPattern);
  if (zipMatch) {
    result.clientZip = zipMatch[1];
  }

  return result;
}

/**
 * Helper function to parse currency
 */
function parseCurrency(value: string): number {
  if (!value || value.trim() === '') return 0;
  // Remove dots (thousands separator) and replace comma with dot
  const cleaned = value.replace(/\./g, '').replace(',', '.');
  return Math.round(parseFloat(cleaned) * 100) || 0;
}

/**
 * Parse airline operations from extracted text using table structure
 */
function parseAirlineOperations(text: string, invoiceId: string): InsertAirlineOperation[] {
  const operations: InsertAirlineOperation[] = [];
  
  // Find all airline sections (Cia: AD, Cia: JJ, etc.)
  // Pattern: "Cia: XX" followed by data rows until "TOTAL DA CIA"
  const airlineSectionRegex = /Cia:\s*([A-Z]{2})[^\n]*\n([\s\S]*?)(?=Cia:|TOTAL GERAL|$)/g;
  
  let match;
  while ((match = airlineSectionRegex.exec(text)) !== null) {
    const airline = match[1];
    const sectionText = match[2];
    
    // Split section into lines
    const lines = sectionText.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      // Skip empty lines, headers, and total lines
      if (!trimmed || trimmed.includes('Passageiro') || trimmed.includes('TOTAL DA CIA')) {
        continue;
      }
      
      // Try to parse the line as data
      // Split by multiple spaces or tabs
      const parts = trimmed.split(/\s{2,}|\t+/).filter(p => p.trim());
      
      // Need at least 15 fields for a valid row
      if (parts.length >= 15) {
        try {
          const operation: InsertAirlineOperation = {
            invoiceId,
            airline,
            passengerName: parts[0]?.trim() || '',
            route: parts[1]?.trim() || '',
            emissionDate: parts[2]?.trim() || '',
            ticketNumber: parts[3]?.trim() || '',
            tariff: parseCurrency(parts[4]),
            tax: parseCurrency(parts[5]),
            cardRAV: parseCurrency(parts[6]),
            commission: parseCurrency(parts[7]),
            incentive: parseCurrency(parts[8]),
            discount: parseCurrency(parts[9]),
            taxAmount: parseCurrency(parts[10]),
            fee: parseCurrency(parts[11]),
            adminFee: parseCurrency(parts[12]),
            netAmount: parseCurrency(parts[13]),
            duTax: parseCurrency(parts[14]),
            observation: parts[15]?.trim(),
          };
          
          // Only add if has passenger name and ticket number
          if (operation.passengerName && operation.ticketNumber) {
            operations.push(operation);
          }
        } catch (e) {
          // Skip malformed lines
        }
      }
    }
  }
  
  return operations;
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

    // Parse airline operations (primary source of data)
    const airlineOperations = parseAirlineOperations(rawText, invoiceId);

    // Convert airline operations to ticket format
    const tickets: InsertSalesTicket[] = airlineOperations.map(op => ({
      invoiceId: op.invoiceId,
      passengerName: op.passengerName,
      emissionDate: op.emissionDate,
      ticketNumber: op.ticketNumber,
      airline: op.airline,
      saleType: 'Domestico',
      tariff: op.tariff,
      tax: op.tax,
      cardRAV: op.cardRAV,
      commission: op.commission,
      incentive: op.incentive,
      discount: op.discount,
      taxAmount: op.taxAmount,
      fee: op.fee,
      adminFee: op.adminFee,
      netAmount: op.netAmount,
      duTax: op.duTax,
    }));

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
