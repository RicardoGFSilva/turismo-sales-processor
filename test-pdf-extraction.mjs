import fs from 'fs';
import path from 'path';

// Import pdf-parse
const pdfParseModule = await import('pdf-parse/lib/pdf-parse.js');
const PDFParse = pdfParseModule.default;

const pdfPath = '/home/ubuntu/upload/FTS-SAO00402220250715.pdf';
const buffer = fs.readFileSync(pdfPath);

try {
  const pdf = await PDFParse(buffer);
  console.log('=== PDF EXTRACTION RESULT ===');
  console.log('Number of pages:', pdf.numpages);
  console.log('\n=== PDF TEXT (first 2000 chars) ===');
  console.log(pdf.text.substring(0, 2000));
  console.log('\n=== END ===');
} catch (error) {
  console.error('Error extracting PDF:', error.message);
}
