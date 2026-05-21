import fs from 'fs';
import pdf from 'pdf-parse';
import { ParsedPage } from '../types';
import { logger } from '../services/logger';

export class PdfParser {
  async parse(pdfPath: string): Promise<ParsedPage[]> {
    if (!fs.existsSync(pdfPath)) {
      throw new Error(`PDF file not found at path: ${pdfPath}`);
    }

    const dataBuffer = fs.readFileSync(pdfPath);
    const pages: ParsedPage[] = [];

    // Custom pagerender to capture text page-by-page
    const pagerender = async (pageData: any): Promise<string> => {
      const textContent = await pageData.getTextContent();
      let lastY: number | undefined;
      let text = '';

      for (const item of textContent.items) {
        if (lastY === item.transform[5] || lastY === undefined) {
          text += item.str;
        } else {
          text += '\n' + item.str;
        }
        lastY = item.transform[5];
      }

      pages.push({
        pageNumber: pages.length + 1,
        text: text,
      });

      return text;
    };

    logger.info(`Starting PDF text extraction for file: ${pdfPath}`);
    
    await pdf(dataBuffer, { pagerender });

    logger.info(`Successfully parsed ${pages.length} pages from PDF.`);
    
    return pages.sort((a, b) => a.pageNumber - b.pageNumber);
  }
}
