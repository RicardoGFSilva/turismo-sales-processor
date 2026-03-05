import { PDFDocument, PDFPage, rgb } from 'pdf-lib';
import fs from 'fs';

const pdfDoc = await PDFDocument.create();
const page = pdfDoc.addPage([612, 792]);
const { height } = page.getSize();

let yPosition = height - 50;

// Helper to add text
const addText = (text, size = 12, bold = false) => {
  page.drawText(text, {
    x: 50,
    y: yPosition,
    size,
    color: rgb(0, 0, 0),
  });
  yPosition -= size + 10;
};

// Header
addText('FLYTOUR AG DE VIAGENS TURISMO LTDA', 14, true);
addText('CNPJ:51.757.300/0001-50', 10);
addText('ALAMEDA CAMPINAS, 1070 SAO PAULO - SP CEP:01404-200', 10);
addText('E-Mail: faturamento@flytour.com.br', 10);

yPosition -= 10;

// Client info
addText('Cliente: FLOR DO NORDESTE VIAGENS LTDA', 10);
addText('Endereço: RUA ROSSINI ROOSEVELT DE ALBUQUERQUE', 10);
addText('Cidade: JABOATAO DOS GUARARA  Estado: PE  CEP: 54410-310', 10);
addText('C.N.P.J.: 27.758.181/0001-76  Inscrição Estadual: ISENTA', 10);

yPosition -= 10;

// Report header
addText('Relatório de bilhetes constantes na(s) venda(s) do dia: para simples conferência', 10);

yPosition -= 10;

// Airline 1
addText('Cia: AD  Emissao: Faturado  Tipo: Domestico', 10, true);
addText('Passageiro  Rota  Emissao  TKT/LOC  Tarifa R$  Taxa', 9);

// Ticket 1
addText('SILVA/RICARDO GONCAL REC/GIG/REC 31/08/25 11/07 5771006661783 LLJ22T 767,42 93,00', 9);

addText('TOTAL DA CIA  767,42  93,00', 9);

yPosition -= 10;

// Airline 2
addText('Cia: JJ  Emissao: Faturado  Tipo: Domestico', 10, true);
addText('Passageiro  Rota  Emissao  TKT/LOC  Tarifa R$  Taxa', 9);

// Ticket 2
addText('PEREIRA FARIAS/ITALO MAO/BEL 05/02/26 11/07 9572240923349 LA957531 366,03 51,07', 9);

addText('TOTAL DA CIA  366,03  51,07', 9);

yPosition -= 10;

// Total
addText('TOTAL GERAL DOS BILHETES  1.133,45  144,07', 10, true);

// Save PDF
const pdfBytes = await pdfDoc.save();
fs.writeFileSync('/tmp/test-invoice.pdf', pdfBytes);
console.log('PDF created at /tmp/test-invoice.pdf');
