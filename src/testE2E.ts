import * as fs from 'fs';
import * as path from 'path';
import crypto from 'crypto';
import { createSamplePdf } from './createSamplePdf';
import { PdfParser } from './parser/pdfParser';
import { logger } from './services/logger';
import { runCommandLine } from './index'; // Wait, index.ts executes directly, so we can spawn it as a child process!

async function runE2ETest() {
  const pdfPath = path.join(__dirname, '../tender_sample.pdf');
  const outputPath = path.join(__dirname, '../tender_sample_output.json');
  const cacheDir = path.resolve('./.cache');

  try {
    logger.info('--- STEP 1: Creating Sample PDF ---');
    await createSamplePdf(pdfPath);

    logger.info('--- STEP 2: Pre-populating Cache for Complex Page ---');
    // We parse the PDF first to find the exact text of page 2, so we can compute its hash.
    const parser = new PdfParser();
    const pages = await parser.parse(pdfPath);
    
    if (pages.length < 2) {
      throw new Error(`Expected at least 2 pages in sample PDF, got ${pages.length}`);
    }

    const page2Text = pages[1].text;
    const page2Hash = crypto.createHash('sha256').update(page2Text.trim()).digest('hex');
    
    const mockGptExtraction = [
      { name: 'Database Servers', quantity: 4 },
      { name: 'Backup Storage Arrays', quantity: 2 }
    ];

    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }

    const cacheFilePath = path.join(cacheDir, `${page2Hash}.json`);
    fs.writeFileSync(cacheFilePath, JSON.stringify(mockGptExtraction, null, 2), 'utf8');
    logger.info(`Pre-populated cache file at: ${cacheFilePath}`);

    logger.info('--- STEP 3: Spawning Main Orchestrator ---');
    // Execute index.ts using child_process
    const { execSync } = require('child_process');
    const cmd = `npx tsx src/index.ts "${pdfPath}" "${outputPath}"`;
    logger.info(`Running command: ${cmd}`);
    
    // Set PATH environment so node is found
    const env = { ...process.env, PATH: `C:\\Program Files\\nodejs;${process.env.PATH}` };
    const stdout = execSync(cmd, { env, encoding: 'utf8' });
    console.log(stdout);

    logger.info('--- STEP 4: Verifying Final JSON Output ---');
    if (!fs.existsSync(outputPath)) {
      throw new Error(`Output file not found at ${outputPath}`);
    }

    const outputContent = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
    logger.info(`Aggregated Output Content: ${JSON.stringify(outputContent, null, 2)}`);

    const products = outputContent.products as any[];
    
    const expectedProducts = [
      { name: 'Lenovo Thinkpad Laptop', quantity: 15 },
      { name: 'Dell Monitor 24"', quantity: 30 },
      { name: 'Logitech Wireless Mouse', quantity: 45 },
      { name: 'Logitech Keyboards', quantity: 45 },
      { name: 'Database Servers', quantity: 4 },
      { name: 'Backup Storage Arrays', quantity: 2 }
    ];

    let allPassed = true;
    for (const expected of expectedProducts) {
      const match = products.find(p => p.name.toLowerCase() === expected.name.toLowerCase() && p.quantity === expected.quantity);
      if (match) {
        logger.info(`[PASS] Found product: "${expected.name}" with quantity ${expected.quantity}`);
      } else {
        logger.error(`[FAIL] Could not find expected product: "${expected.name}" with quantity ${expected.quantity}`);
        allPassed = false;
      }
    }

    if (allPassed && products.length === expectedProducts.length) {
      logger.info('==================================================');
      logger.info('       END-TO-END INTEGRATION TEST: PASSED!       ');
      logger.info('==================================================');
    } else {
      logger.error('==================================================');
      logger.error('       END-TO-END INTEGRATION TEST: FAILED!       ');
      logger.error('==================================================');
      process.exit(1);
    }

    // Clean up
    fs.unlinkSync(pdfPath);
    fs.unlinkSync(outputPath);
    fs.unlinkSync(cacheFilePath);
    logger.info('Temporary test files successfully cleaned up.');

  } catch (error) {
    logger.error('E2E integration test failed with error:', error);
    process.exit(1);
  }
}

runE2ETest();
