import { PDFParse } from 'pdf-parse';
import fs from 'fs';

const buffer = fs.readFileSync('/home/ubuntu/upload/FTS-SAO00402220250715.pdf');

try {
  const parser = new PDFParse({ data: buffer });
  const textResult = await parser.getText();
  const text = textResult.text;
  
  console.log('=== FULL PARSER TEST ===\n');
  
  // Test invoice ID extraction
  let match = text.match(/FTS-[A-Z0-9]+/);
  console.log('1. Invoice ID:', match ? match[0] : 'GENERATED');
  
  // Test agency extraction
  match = text.match(/FLYTOUR[^\n]*/);
  console.log('2. Agency:', match ? match[0].trim() : 'NOT FOUND');
  
  // Test CNPJ extraction
  const cnpjMatches = text.match(/\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}/g);
  console.log('3. Agency CNPJ:', cnpjMatches ? cnpjMatches[0] : 'NOT FOUND');
  console.log('4. Client CNPJ:', cnpjMatches && cnpjMatches.length > 1 ? cnpjMatches[1] : 'NOT FOUND');
  
  // Test client extraction
  match = text.match(/Cliente:\s*([^\n]+)/);
  console.log('5. Client:', match ? match[1].trim() : 'NOT FOUND');
  
  // Test ticket parsing
  console.log('\n6. Parsing tickets:');
  const lines = text.split('\n');
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
  
} catch (err) {
  console.error('ERROR:', err.message);
  console.error('Stack:', err.stack);
}
