import { PdfParser } from './pdfParser';
import { logger } from '../services/logger';
import * as fs from 'fs';
import * as https from 'https';
import * as path from 'path';

const SAMPLE_PDF_URL = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';
const SAMPLE_PDF_PATH = path.join(__dirname, '../../sample_dummy.pdf');

function downloadFile(url: string, dest: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

async function runTest() {
  try {
    if (!fs.existsSync(SAMPLE_PDF_PATH)) {
      logger.info(`Downloading sample PDF from ${SAMPLE_PDF_URL}...`);
      await downloadFile(SAMPLE_PDF_URL, SAMPLE_PDF_PATH);
      logger.info(`Downloaded sample PDF to ${SAMPLE_PDF_PATH}`);
    }

    const parser = new PdfParser();
    const pages = await parser.parse(SAMPLE_PDF_PATH);

    logger.info(`Parser test results:`);
    logger.info(`- Total pages extracted: ${pages.length}`);
    pages.forEach((page) => {
      logger.info(`Page ${page.pageNumber} text preview: "${page.text.trim().substring(0, 100)}..."`);
    });

    if (pages.length > 0) {
      logger.info('SUCCESS: PDF Parser works page-by-page!');
    } else {
      logger.error('FAILURE: No pages extracted.');
    }
  } catch (error) {
    logger.error('Error during PDF Parser verification:', error);
  }
}

runTest();
