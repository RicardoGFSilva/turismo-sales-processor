// Test the improved parser logic

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

console.log('=== TESTING IMPROVED PARSER LOGIC ===\n');

const lines = sampleText.split('\n');
const tickets = [];

// First, collect all non-empty lines
const cleanLines = lines.map(l => l.trim()).filter(l => l && !l.includes('Cia:') && !l.includes('Passageiro') && !l.includes('TOTAL'));

console.log('Looking for tickets with airline codes and values...\n');

for (let i = 0; i < cleanLines.length; i++) {
  const line = cleanLines[i];

  // Look for airline code (2 letters followed by numbers)
  const airlineMatch = line.match(/\b([A-Z]{2})\d+[A-Z]?\b/);
  if (!airlineMatch) {
    continue;
  }

  // Look for monetary values (tariff and tax)
  const valuesMatch = line.match(/(\d+[.,]\d{2})\s+(\d+[.,]\d{2})/);
  if (!valuesMatch) {
    continue;
  }

  console.log(`Line ${i}: "${line}"`);
  console.log(`  Airline: ${airlineMatch[1]}, Values: ${valuesMatch[1]} | ${valuesMatch[2]}`);

  // Search backwards for passenger and route
  let passengerName = '';
  let route = '';

  for (let j = i - 1; j >= Math.max(0, i - 10); j--) {
    const prevLine = cleanLines[j];
    
    // Look for route (3 letters / 3 letters or just 3 letters)
    if (!route && (prevLine.match(/^[A-Z]{3}\/[A-Z]{3}$/) || prevLine.match(/^[A-Z]{3}$/))) {
      route = prevLine;
      console.log(`  Found route at line ${j}: ${route}`);
    }
    
    // Look for passenger name (contains letters, spaces, slashes)
    if (!passengerName && prevLine.match(/^[A-Z][A-Z\s\/]+$/) && !prevLine.includes('/')) {
      passengerName = prevLine;
      console.log(`  Found passenger at line ${j}: ${passengerName}`);
    }
    
    // If we have both, stop searching
    if (passengerName && route) break;
  }

  if (passengerName && route) {
    tickets.push({
      passengerName,
      route,
      airline: airlineMatch[1],
      tariff: valuesMatch[1],
      tax: valuesMatch[2],
    });
    console.log(`  ✓ Ticket added\n`);
  } else {
    console.log(`  ✗ Missing: passenger=${!!passengerName}, route=${!!route}\n`);
  }
}

console.log(`\nTotal tickets found: ${tickets.length}`);
console.log('\nTickets:');
tickets.forEach((t, i) => {
  console.log(`${i + 1}. ${t.passengerName} | ${t.route} | ${t.airline} | ${t.tariff} | ${t.tax}`);
});
