import { PageComplexity } from '../types';
import { logger } from '../services/logger';

export class PageClassifier {
  classify(pageText: string): PageComplexity {
    const trimmedText = pageText.trim();
    if (!trimmedText) {
      logger.debug('Empty page detected. Classifying as SIMPLE.');
      return 'SIMPLE';
    }

    // Split text into lines and words
    const lines = trimmedText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    const words = trimmedText.split(/\s+/).filter(word => word.length > 0);

    // Heuristic 1: Check complex keywords first
    const complexKeywords = ['shall', 'must', 'responsible', 'requirements', 'contractor', 'scope', 'undertake', 'specification', 'guidelines', 'procurement'];
    const keywordMatches = words.filter(word => {
      const cleanWord = word.toLowerCase().replace(/[^a-z]/g, '');
      return complexKeywords.includes(cleanWord);
    }).length;

    if (keywordMatches >= 2) {
      logger.debug(`Tender prose keywords detected (${keywordMatches} matches). Classifying as COMPLEX.`);
      return 'COMPLEX';
    }

    // Heuristic 2: If there are very few numbers/digits, it's not a standard product-quantity list
    const digitsCount = (trimmedText.match(/\d+/g) || []).length;
    if (digitsCount < 2) {
      logger.debug(`Very few digits found (${digitsCount}). Classifying as COMPLEX (likely descriptive page).`);
      return 'COMPLEX';
    }

    // Heuristic 3: Very low word count (less than 50 words) is generally simple
    if (words.length < 50) {
      logger.debug(`Tiny page (${words.length} words). Classifying as SIMPLE.`);
      return 'SIMPLE';
    }

    // Heuristic 4: Check for density of structural lines (lines that look like key-value or item-qty)
    const simpleLinePatterns = [
      /^[a-zA-Z0-9\s()./,-]+\s+[-:|]?\s*\d+\s*(?:pcs|units|nos|qty|quantity)?$/i, // "Product Name 10" or "Product Name - 10"
      /^(?:qty|quantity|amount|quantity required)\s*:\s*\d+$/i, // "Qty: 10"
      /^\d+\s*[-.]\s*[a-zA-Z0-9\s()./,-]+$/i // "1. Product Name" (numbered list)
    ];

    let simpleLineCount = 0;
    for (const line of lines) {
      const isSimple = simpleLinePatterns.some(pattern => pattern.test(line));
      if (isSimple) {
        simpleLineCount++;
      }
    }

    const simpleLineRatio = simpleLineCount / lines.length;
    logger.debug(`Line analysis: ${simpleLineCount}/${lines.length} lines match simple patterns (Ratio: ${simpleLineRatio.toFixed(2)})`);

    if (simpleLineRatio >= 0.40 && words.length < 250) {
      logger.debug(`High density of simple structure patterns (${(simpleLineRatio * 100).toFixed(0)}%). Classifying as SIMPLE.`);
      return 'SIMPLE';
    }

    if (words.length > 150) {
      logger.debug(`Dense page (${words.length} words). Classifying as COMPLEX.`);
      return 'COMPLEX';
    }

    logger.debug('Fallback classification: COMPLEX.');
    return 'COMPLEX';
  }
}
