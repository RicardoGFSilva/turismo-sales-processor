import { describe, it, expect } from 'vitest';
import {
  validateCNPJ,
  validateMonetaryValue,
  validateDate,
  validatePassengerName,
  validateRoute,
  validateAirlineCode,
  validateInvoiceId,
  validateInvoice,
} from './validators';

describe('CNPJ Validation', () => {
  it('should reject an empty CNPJ', () => {
    const result = validateCNPJ('');
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('CNPJ não pode estar vazio');
  });

  it('should reject CNPJ with incorrect length', () => {
    const result = validateCNPJ('12.345.678/0001');
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes('14 dígitos'))).toBe(true);
  });

  it('should reject CNPJ with repeated digits', () => {
    const result = validateCNPJ('11.111.111/1111-11');
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes('repetidos'))).toBe(true);
  });

  it('should reject CNPJ with invalid check digits', () => {
    const result = validateCNPJ('51.757.300/0001-99');
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes('dígito verificador'))).toBe(true);
  });
});

describe('Monetary Value Validation', () => {
  it('should validate a positive value', () => {
    const result = validateMonetaryValue(100.50);
    expect(result.isValid).toBe(true);
  });

  it('should validate a string value', () => {
    const result = validateMonetaryValue('250.75');
    expect(result.isValid).toBe(true);
  });

  it('should reject negative values', () => {
    const result = validateMonetaryValue(-50);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Valor não pode ser negativo');
  });

  it('should reject values with more than 2 decimal places', () => {
    const result = validateMonetaryValue(100.999);
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes('2 casas decimais'))).toBe(true);
  });

  it('should reject values exceeding maximum', () => {
    const result = validateMonetaryValue(2000000);
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes('limite máximo'))).toBe(true);
  });

  it('should reject empty values', () => {
    const result = validateMonetaryValue('');
    expect(result.isValid).toBe(false);
  });

  it('should reject non-numeric values', () => {
    const result = validateMonetaryValue('abc');
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Valor deve ser um número válido');
  });
});

describe('Date Validation', () => {
  it('should validate a date in DD/MM/YYYY format', () => {
    const result = validateDate('15/03/2025');
    expect(result.isValid).toBe(true);
  });

  it('should validate a date in YYYY-MM-DD format', () => {
    const result = validateDate('2025-03-15');
    expect(result.isValid).toBe(true);
  });

  it('should reject invalid date formats', () => {
    const result = validateDate('03-15-2025');
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes('formato'))).toBe(true);
  });

  it('should reject dates before 2000', () => {
    const result = validateDate('15/03/1999');
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes('2000'))).toBe(true);
  });

  it('should reject future dates', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 2);
    const dateStr = `${String(tomorrow.getDate()).padStart(2, '0')}/${String(tomorrow.getMonth() + 1).padStart(2, '0')}/${tomorrow.getFullYear()}`;
    
    const result = validateDate(dateStr);
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes('futuro'))).toBe(true);
  });

  it('should reject empty dates', () => {
    const result = validateDate('');
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Data não pode estar vazia');
  });
});

describe('Passenger Name Validation', () => {
  it('should validate a valid passenger name', () => {
    const result = validatePassengerName('SILVA/RICARDO');
    expect(result.isValid).toBe(true);
  });

  it('should validate a name with spaces', () => {
    const result = validatePassengerName('PEREIRA FARIAS/ITALO');
    expect(result.isValid).toBe(true);
  });

  it('should reject empty names', () => {
    const result = validatePassengerName('');
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Nome do passageiro não pode estar vazio');
  });

  it('should reject names shorter than 3 characters', () => {
    const result = validatePassengerName('AB');
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes('3 caracteres'))).toBe(true);
  });

  it('should reject names exceeding 100 characters', () => {
    const longName = 'A'.repeat(101);
    const result = validatePassengerName(longName);
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes('100 caracteres'))).toBe(true);
  });

  it('should reject names with invalid characters', () => {
    const result = validatePassengerName('SILVA@123');
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes('inválidos'))).toBe(true);
  });
});

describe('Route Validation', () => {
  it('should validate a route with two airports', () => {
    const result = validateRoute('REC/GIG');
    expect(result.isValid).toBe(true);
  });

  it('should validate a route with one airport', () => {
    const result = validateRoute('SAO');
    expect(result.isValid).toBe(true);
  });

  it('should reject empty routes', () => {
    const result = validateRoute('');
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Rota não pode estar vazia');
  });

  it('should reject invalid route formats', () => {
    const result = validateRoute('RE/GIG');
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes('XXX'))).toBe(true);
  });

  it('should reject routes with lowercase letters', () => {
    const result = validateRoute('rec/gig');
    expect(result.isValid).toBe(false);
  });
});

describe('Airline Code Validation', () => {
  it('should validate a valid airline code', () => {
    const result = validateAirlineCode('LA');
    expect(result.isValid).toBe(true);
  });

  it('should validate another airline code', () => {
    const result = validateAirlineCode('AA');
    expect(result.isValid).toBe(true);
  });

  it('should reject empty codes', () => {
    const result = validateAirlineCode('');
    expect(result.isValid).toBe(false);
  });

  it('should reject codes with more than 2 letters', () => {
    const result = validateAirlineCode('LAT');
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes('2 letras'))).toBe(true);
  });

  it('should reject codes with lowercase letters', () => {
    const result = validateAirlineCode('la');
    expect(result.isValid).toBe(false);
  });
});

describe('Invoice ID Validation', () => {
  it('should validate a valid invoice ID', () => {
    const result = validateInvoiceId('FTS-SAO00402220250715');
    expect(result.isValid).toBe(true);
  });

  it('should reject empty IDs', () => {
    const result = validateInvoiceId('');
    expect(result.isValid).toBe(false);
  });

  it('should reject IDs without FTS prefix', () => {
    const result = validateInvoiceId('SAO00402220250715');
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes('FTS-'))).toBe(true);
  });

  it('should reject IDs with insufficient characters', () => {
    const result = validateInvoiceId('FTS-SAO');
    expect(result.isValid).toBe(false);
  });
});

describe('Complete Invoice Validation', () => {
  it('should validate invoice with all required fields present', () => {
    const result = validateInvoice({
      invoiceId: 'FTS-SAO00402220250715',
      agencyName: 'FLYTOUR AG DE VIAGENS',
      agencyCNPJ: '99.999.999/9999-99', // Invalid CNPJ but testing structure
      clientName: 'FLOR DO NORDESTE VIAGENS',
      clientCNPJ: '99.999.999/9999-99', // Invalid CNPJ but testing structure
      tickets: [
        {
          passengerName: 'SILVA/RICARDO',
          route: 'REC/GIG',
          airline: 'LA',
          tariff: 767.42,
          tax: 93.00,
        },
      ],
    });

    // Should have errors due to invalid CNPJs
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('should reject invoice with no tickets', () => {
    const result = validateInvoice({
      invoiceId: 'FTS-SAO00402220250715',
      agencyName: 'FLYTOUR AG DE VIAGENS',
      agencyCNPJ: '99.999.999/9999-99',
      clientName: 'FLOR DO NORDESTE VIAGENS',
      clientCNPJ: '99.999.999/9999-99',
      tickets: [],
    });

    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes('pelo menos um bilhete'))).toBe(true);
  });

  it('should reject invoice with invalid ticket data', () => {
    const result = validateInvoice({
      invoiceId: 'FTS-SAO00402220250715',
      agencyName: 'FLYTOUR AG DE VIAGENS',
      agencyCNPJ: '99.999.999/9999-99',
      clientName: 'FLOR DO NORDESTE VIAGENS',
      clientCNPJ: '99.999.999/9999-99',
      tickets: [
        {
          passengerName: 'SILVA/RICARDO',
          route: null,
          airline: 'LA',
          tariff: 767.42,
          tax: 93.00,
        },
      ],
    });

    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes('Bilhete 1'))).toBe(true);
  });
});
