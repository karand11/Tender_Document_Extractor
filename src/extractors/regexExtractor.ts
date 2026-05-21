import { Product } from '../types';
import { logger } from '../services/logger';

export class RegexExtractor {
  async extract(text: string): Promise<Product[]> {
    const products: Product[] = [];
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);

    const patterns = [
      // Pattern 1: Optional list numbering, Name, separator (spaces or symbols), Quantity
      /^(?:\d+\s*[-.]\s*)?([a-zA-Z0-9\s()./,"'-]+?)(?:\s+[-:|]?\s*|\s*[-:|]\s*)(\d+)\s*(?:pcs|units|nos|qty|quantity|pc|nos\b|units\b)?$/i,
      
      // Pattern 2: Single line labeled key-value Product: [Name] ... Quantity: [Qty]
      /product\s*:\s*([a-zA-Z0-9\s()./,"'-]+?)\s+quantity\s*:\s*(\d+)/i,

      // Pattern 3: Single line labeled key-value Quantity: [Qty] ... Product: [Name]
      /quantity\s*:\s*(\d+)\s+product\s*:\s*([a-zA-Z0-9\s()./,"'-]+?)/i
    ];

    let currentProductName: string | null = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      let matched = false;
      for (const pattern of patterns) {
        const match = line.match(pattern);
        if (match) {
          if (pattern.source.startsWith('quantity')) {
            const qty = parseInt(match[1], 10);
            const name = match[2].trim();
            if (name && !isNaN(qty)) {
              products.push({ name, quantity: qty });
              matched = true;
              break;
            }
          } else {
            const name = match[1].trim();
            const qty = parseInt(match[2], 10);
            if (name && !isNaN(qty) && isNaN(Number(name))) {
              products.push({ name, quantity: qty });
              matched = true;
              break;
            }
          }
        }
      }

      if (matched) continue;

      // Handle multi-line key-value pairs
      const productLabelMatch = line.match(/^(?:product|item|name)\s*:\s*(.+)$/i);
      if (productLabelMatch) {
        currentProductName = productLabelMatch[1].trim();
        continue;
      }

      const qtyLabelMatch = line.match(/^(?:quantity|qty|units|nos|count)\s*:\s*(\d+)$/i);
      if (qtyLabelMatch && currentProductName) {
        const qty = parseInt(qtyLabelMatch[1], 10);
        products.push({ name: currentProductName, quantity: qty });
        currentProductName = null;
        continue;
      }
    }

    logger.debug(`Regex Extractor parsed ${products.length} products.`);
    return products;
  }
}
