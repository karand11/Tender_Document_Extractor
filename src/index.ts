import * as path from 'path';
import { PdfParser } from './parser/pdfParser';
import { PageClassifier } from './classifier/pageClassifier';
import { RegexExtractor } from './extractors/regexExtractor';
import { GptExtractor } from './extractors/gptExtractor';
import { CacheManager } from './cache/cacheManager';
import { OutputAggregator } from './output/outputAggregator';
import { logger } from './services/logger';
import { Product } from './types';

// Blended pricing helper for GPT-4o-mini
// Input: $0.15 / 1M tokens ($0.00015 / 1K tokens)
// Output: $0.60 / 1M tokens ($0.00060 / 1K tokens)
const GPT_MINI_COST_PER_TOKEN = 0.000000375; // average blended rate

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    logger.error('Usage: npm run dev <path_to_pdf_file> [output_json_path]');
    process.exit(1);
  }

  const pdfPath = path.resolve(args[0]);
  const defaultOutputPath = path.join(path.dirname(pdfPath), 'extracted_products.json');
  const outputPath = args[1] ? path.resolve(args[1]) : defaultOutputPath;

  logger.info(`Starting TenderDoc Extractor pipeline for: ${pdfPath}`);

  const parser = new PdfParser();
  const classifier = new PageClassifier();
  const regexExtractor = new RegexExtractor();
  const gptExtractor = new GptExtractor();
  const cacheManager = new CacheManager();
  const outputAggregator = new OutputAggregator();

  try {
    // 1. Parse PDF
    const pages = await parser.parse(pdfPath);
    if (pages.length === 0) {
      logger.error('No pages could be parsed from the PDF document.');
      process.exit(1);
    }

    // Attempt to guess tender name from first page text, or fallback to file name
    let tenderName = path.basename(pdfPath, path.extname(pdfPath));
    const firstPageText = pages[0]?.text || '';
    const tenderNameMatch = firstPageText.match(/(?:tender for|name of work|project title|subject)\s*:\s*([^\n]+)/i);
    if (tenderNameMatch && tenderNameMatch[1].trim().length > 3) {
      tenderName = tenderNameMatch[1].trim();
    }

    // 2. Loop through pages and extract
    const allExtractedProducts: Product[] = [];
    
    // Analytics
    let regexCount = 0;
    let gptCount = 0;
    let cacheHits = 0;
    let totalTokens = 0;

    for (const page of pages) {
      logger.info(`--- Processing Page ${page.pageNumber}/${pages.length} ---`);
      
      const complexity = classifier.classify(page.text);
      logger.info(`Page ${page.pageNumber} classified as ${complexity}`);

      let pageProducts: Product[] = [];

      if (complexity === 'SIMPLE') {
        logger.info(`Routing Page ${page.pageNumber} to Regex Extractor...`);
        pageProducts = await regexExtractor.extract(page.text);
        regexCount++;
      } else {
        // COMPLEX -> Check cache first
        logger.info(`Checking Cache for Page ${page.pageNumber}...`);
        const cachedProducts = await cacheManager.get(page.text);

        if (cachedProducts !== null) {
          logger.info(`Cache Hit on Page ${page.pageNumber}! Loading extracted products...`);
          pageProducts = cachedProducts;
          cacheHits++;
        } else {
          // Cache Miss -> Call GPT
          logger.info(`Cache Miss on Page ${page.pageNumber}. Routing to GPT Extractor...`);
          const gptResult = await gptExtractor.extract(page.text);
          pageProducts = gptResult.products;
          
          if (pageProducts.length > 0) {
            await cacheManager.set(page.text, pageProducts);
          }
          
          totalTokens += gptResult.tokensUsed;
          gptCount++;
        }
      }

      logger.info(`Extracted ${pageProducts.length} items from Page ${page.pageNumber}`);
      allExtractedProducts.push(...pageProducts);
    }

    // 3. Aggregate results
    logger.info('Aggregating and consolidating product quantities...');
    const consolidatedOutput = outputAggregator.aggregate(tenderName, allExtractedProducts);

    // 4. Save results
    await outputAggregator.save(consolidatedOutput, outputPath);

    // 5. Statistics report
    const estimatedCost = totalTokens * GPT_MINI_COST_PER_TOKEN;
    const cacheSavings = cacheHits * 1500 * GPT_MINI_COST_PER_TOKEN; // Assuming average ~1500 tokens per page saved
    const regexSavings = regexCount * 1500 * GPT_MINI_COST_PER_TOKEN; // Assuming average ~1500 tokens per page saved

    console.log('\n==================================================');
    console.log('            PIPELINE EXECUTION SUMMARY             ');
    console.log('==================================================');
    console.log(`Document Name:     ${tenderName}`);
    console.log(`Total Pages:       ${pages.length}`);
    console.log(`Regex Router:      ${regexCount} page(s) processed`);
    console.log(`GPT Cache Hits:    ${cacheHits} page(s) retrieved`);
    console.log(`GPT Live Calls:    ${gptCount} page(s) invoked`);
    console.log(`GPT Tokens Used:   ${totalTokens} tokens`);
    console.log(`Estimated Cost:    $${estimatedCost.toFixed(4)}`);
    console.log(`Estimated Savings: $${(cacheSavings + regexSavings).toFixed(4)} (from cache/regex bypass)`);
    console.log(`Products Extracted: ${consolidatedOutput.products.length} distinct item(s)`);
    console.log('==================================================\n');

  } catch (error) {
    logger.error('Pipeline processing failed:', error);
    process.exit(1);
  }
}

main();
