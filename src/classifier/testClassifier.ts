import { PageClassifier } from './pageClassifier';
import { logger } from '../services/logger';

async function runTest() {
  const classifier = new PageClassifier();

  const simpleListText = `
    TENDER REQUIREMENT LIST:
    1. Lenovo ThinkPad Laptops - 15
    2. Dell Monitors 24" - 30
    3. Logitech Keyboards - 30
    4. Logitech Mouse - 30
  `;

  const simpleKeyValueText = `
    PRODUCT REQUIREMENTS:
    Product: Enterprise Router
    Quantity: 5
    Product: Network Switch 24-Port
    Quantity: 10
  `;

  const complexTenderText = `
    Section 4.1: Hardware Procurement Guidelines
    The contractor shall be responsible for the supply, installation, and configuration of high-end database servers.
    All supplied hardware must meet the minimum specifications outlined in Appendix C.
    The primary database cluster requires 3 Rack Servers with dual Intel Xeon processors, 128GB RAM, and 2TB SSD storage.
    Additionally, the contractor must provide 2 backup storage arrays of 10TB each.
    All installations must comply with local government electrical and data safety regulations.
  `;

  logger.info('Testing Page Classifier Heuristics...');

  const result1 = classifier.classify(simpleListText);
  logger.info(`Test 1 (Simple List) Result: ${result1} (Expected: SIMPLE)`);

  const result2 = classifier.classify(simpleKeyValueText);
  logger.info(`Test 2 (Simple Key-Value) Result: ${result2} (Expected: SIMPLE)`);

  const result3 = classifier.classify(complexTenderText);
  logger.info(`Test 3 (Complex Tender Text) Result: ${result3} (Expected: COMPLEX)`);

  if (result1 === 'SIMPLE' && result2 === 'SIMPLE' && result3 === 'COMPLEX') {
    logger.info('SUCCESS: Page Classifier heuristics correctly route simple and complex texts!');
  } else {
    logger.error('FAILURE: Page Classifier returned incorrect results.');
  }
}

runTest();
