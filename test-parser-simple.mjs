import { PDFParse } from 'pdf-parse';
import fs from 'fs';

// Create a simple test by reading from stdin or using a sample text
const sampleText = `FLYTOUR AG DE VIAGENS TURISMO LTDA
CNPJ:51.757.300/0001-50
ALAMEDA CAMPINAS, 1070 SAO PAULO - SP CEP:01404-200
E-Mail: faturamento@flytour.com.br
Cliente: FLOR DO NORDESTE VIAGENS LTDA
Endereço: RUA ROSSINI ROOSEVELT DE ALBUQUERQUE
Cidade: JABOATAO DOS GUARARA Estado: PE CEP: 54410-310
C.N.P.J.: 27.758.181/0001-76 Inscrição Estadual: ISENTA
Relatório de bilhetes constantes na(s) venda(s) do dia: para simples conferência
Cia: AD Emissao: Faturado Tipo: Domestico
Passageiro Rota Emissao TKT/LOC Tarifa R$ Taxa Cartão/RAV Comissão Incentivo Desconto Imposto Fee TxAdmCrt Liquido TxDU Obs
SILVA/RICARDO
GONCAL
REC/GIG/REC
31/08/25 11/07 5771006661783
LLJ22T 767,42 93,00 0,00 0,00 11,51 0,00 0,00 0,00 0,00 848,91 76,74
TOTAL DA CIA 767,42 93,00 0,00 0,00 11,51 0,00 0,00 0,00 0,00 848,91 76,74
Cia: JJ Emissao: Faturado Tipo: Domestico
Passageiro Rota Emissao TKT/LOC Tarifa R$ Taxa Cartão/RAV Comissão Incentivo Desconto Imposto Fee TxAdmCrt Liquido TxDU Obs
PEREIRA FARIAS/ITALO MAO/BEL
05/02/26 11/07 9572240923349
LA957531 366,03 51,07 0,00 0,00 3,66 0,00 0,00 0,00 0,00 413,44 40,00
TOTAL DA CIA 366,03 51,07 0,00 0,00 3,66 0,00 0,00 0,00 0,00 413,44 40,00
Descrição Tarifa R$ Taxa Cartão Comissão Incentivo Desconto Imposto Fee TxAdmCrt Liquido TxDU
TOTAL GERAL DOS BILHETES 1.133,45 144,07 0,00 0,00 15,17 0,00 0,00 0,00 0,00 1.262,35 116,74`;

console.log('=== PARSER TEST WITH SAMPLE TEXT ===\n');

// Test invoice ID extraction
let match = sampleText.match(/FTS-[A-Z0-9]+/);
console.log('1. Invoice ID:', match ? match[0] : 'GENERATED');

// Test agency extraction
match = sampleText.match(/FLYTOUR[^\n]*/);
console.log('2. Agency:', match ? match[0].trim() : 'NOT FOUND');

// Test CNPJ extraction
const cnpjMatches = sampleText.match(/\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}/g);
console.log('3. Agency CNPJ:', cnpjMatches ? cnpjMatches[0] : 'NOT FOUND');
console.log('4. Client CNPJ:', cnpjMatches && cnpjMatches.length > 1 ? cnpjMatches[1] : 'NOT FOUND');

// Test client extraction
match = sampleText.match(/Cliente:\s*([^\n]+)/);
console.log('5. Client:', match ? match[1].trim() : 'NOT FOUND');

// Test ticket parsing
console.log('\n6. Parsing tickets:');
const lines = sampleText.split('\n');
let ticketCount = 0;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  // Skip header lines
  if (!line.trim() || line.includes('Cia:') || line.includes('Passageiro') || line.includes('TOTAL')) {
    continue;
  }
  
  // Look for passenger names
  const passengerMatch = line.match(/^([A-Z][A-Z\s\/]+?)\s+([A-Z]{3}\/[A-Z]{3}|[A-Z]{3})/);
  if (!passengerMatch) {
    continue;
  }
  
  // Check for airline code
  const airlineMatch = line.match(/\b([A-Z]{2})\d+[A-Z]?\b/);
  if (!airlineMatch) {
    continue;
  }
  
  // Check for values
  const valuesMatch = line.match(/(\d+[.,]\d{2})\s+(\d+[.,]\d{2})/);
  if (!valuesMatch) {
    continue;
  }
  
  ticketCount++;
  console.log(`   Ticket ${ticketCount}: ${passengerMatch[1].trim()} | ${passengerMatch[2]} | ${airlineMatch[1]} | ${valuesMatch[1]} | ${valuesMatch[2]}`);
}

console.log('\n7. Total tickets found:', ticketCount);
