import { RegexExtractor } from './regexExtractor';
import { GptExtractor } from './gptExtractor';
import { logger } from '../services/logger';

async function runTest() {
  logger.info('Testing Extractors...');

  // 1. Test Regex Extractor
  const regexExtractor = new RegexExtractor();
  
  const mockSimpleText1 = `
    1. Lenovo ThinkPad Laptops - 15 pcs
    2. Dell Monitors 24" - 30 units
    3. Logitech Keyboards: 12
    Product: Enterprise Router Quantity: 5
  `;

  logger.info('Testing Regex Extractor on mock simple text...');
  const regexProducts = await regexExtractor.extract(mockSimpleText1);
  
  logger.info(`Regex Extractor results: ${JSON.stringify(regexProducts, null, 2)}`);

  const expectedLength = 4;
  if (regexProducts.length === expectedLength) {
    logger.info(`SUCCESS: Regex Extractor parsed exactly ${expectedLength} products!`);
  } else {
    logger.error(`FAILURE: Regex Extractor parsed ${regexProducts.length} products instead of ${expectedLength}.`);
  }

  // 2. Test GPT Extractor (Fallback/Mock warning behavior)
  const gptExtractor = new GptExtractor();
  logger.info('Testing GPT Extractor fallback/warning behavior (with mock-key)...');
  const gptResult = await gptExtractor.extract('Some complex page text here...');
  
  if (gptResult.products.length === 0 && gptResult.tokensUsed === 0) {
    logger.info('SUCCESS: GPT Extractor correctly warns and returns empty list when API key is mock-key.');
  } else {
    logger.warn('GPT Extractor did not trigger fallback path as expected.');
  }
}

runTest();
