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

const lines = sampleText.split('\n');
const cleanLines = lines.map(l => l.trim()).filter(l => l && !l.includes('Cia:') && !l.includes('Passageiro') && !l.includes('TOTAL'));

console.log('Clean lines:');
cleanLines.forEach((line, i) => {
  console.log(`${i}: "${line}"`);
});

console.log('\n\nLooking for airline lines:');
cleanLines.forEach((line, i) => {
  const airlineMatch = line.match(/\b([A-Z]{2})\d+[A-Z]?\b/);
  if (airlineMatch) {
    console.log(`${i}: "${line}" -> Airline: ${airlineMatch[1]}`);
  }
});

console.log('\n\nLooking for route lines:');
cleanLines.forEach((line, i) => {
  if (line.match(/^[A-Z]{3}\/[A-Z]{3}$/) || line.match(/^[A-Z]{3}$/)) {
    console.log(`${i}: "${line}" -> Route`);
  }
});

console.log('\n\nLooking for passenger lines:');
cleanLines.forEach((line, i) => {
  if (line.match(/^[A-Z][A-Z\s\/]+$/) && !line.includes('/')) {
    console.log(`${i}: "${line}" -> Passenger`);
  }
});
