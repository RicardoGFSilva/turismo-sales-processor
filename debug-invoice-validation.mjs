import { validateInvoice } from './server/validators.ts';

const result = validateInvoice({
  invoiceId: 'FTS-SAO00402220250715',
  agencyName: 'FLYTOUR AG DE VIAGENS',
  agencyCNPJ: '51.757.300/0001-57',
  clientName: 'FLOR DO NORDESTE VIAGENS',
  clientCNPJ: '27.758.181/0001-76',
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

console.log('Validation result:');
console.log('isValid:', result.isValid);
console.log('errors:', result.errors);
