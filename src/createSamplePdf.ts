import PDFDocument from 'pdfkit';
import * as fs from 'fs';
import * as path from 'path';
import { logger } from './services/logger';

export function createSamplePdf(outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument();
    const stream = fs.createWriteStream(outputPath);

    doc.pipe(stream);

    // Page 1: Simple Table List
    doc.fontSize(16).text('Tender For Office Procurement', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text('Below is the list of products required for the new office setup:');
    doc.moveDown();
    doc.text('1. Lenovo ThinkPad Laptop - 15 units');
    doc.text('2. Dell Monitor 24" - 30 nos');
    doc.text('3. Logitech Wireless Mouse - 45');
    doc.text('4. Logitech Keyboards: 45');

    // Page 2: Complex Prose Page
    doc.addPage();
    doc.fontSize(16).text('Section 2: Enterprise Server Infrastructure Specifications', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(
      'The contractor shall be responsible for supplying high-performance enterprise equipment. ' +
      'The database tier requires 4 Database Servers with high capacity SSD storage. ' +
      'Additionally, the contractor must supply 2 Backup Storage Arrays. ' +
      'All equipment must meet international procurement guidelines and standards.'
    );

    doc.end();

    stream.on('finish', () => {
      logger.info(`Successfully created sample PDF at: ${outputPath}`);
      resolve();
    });

    stream.on('error', (err) => {
      reject(err);
    });
  });
}

// If run directly
if (require.main === module) {
  const targetPath = path.join(__dirname, '../tender_sample.pdf');
  createSamplePdf(targetPath).catch(err => {
    console.error('Failed to create sample PDF:', err);
  });
}
