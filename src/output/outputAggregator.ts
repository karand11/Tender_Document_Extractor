import fs from 'fs';
import path from 'path';
import { Product, FinalTenderOutput } from '../types';
import { logger } from '../services/logger';

export class OutputAggregator {
  aggregate(tenderName: string, productsList: Product[]): FinalTenderOutput {
    const productMap = new Map<string, number>();

    for (const product of productsList) {
      const normalizedName = this.normalizeName(product.name);
      const existingQuantity = productMap.get(normalizedName) || 0;
      productMap.set(normalizedName, existingQuantity + product.quantity);
    }

    const aggregatedProducts: Product[] = [];
    productMap.forEach((qty, name) => {
      aggregatedProducts.push({
        name,
        quantity: qty
      });
    });

    return {
      tenderName,
      products: aggregatedProducts
    };
  }

  async save(output: FinalTenderOutput, outputPath: string): Promise<void> {
    try {
      const resolvedPath = path.resolve(outputPath);
      const parentDir = path.dirname(resolvedPath);
      
      if (!fs.existsSync(parentDir)) {
        fs.mkdirSync(parentDir, { recursive: true });
      }

      fs.writeFileSync(resolvedPath, JSON.stringify(output, null, 2), 'utf8');
      logger.info(`Successfully wrote final structured JSON to: ${resolvedPath}`);
    } catch (error) {
      logger.error(`Failed to write output JSON to ${outputPath}:`, error);
      throw error;
    }
  }

  private normalizeName(name: string): string {
    return name
      .replace(/\s+/g, ' ')
      .trim()
      .split(' ')
      .map(word => {
        if (word.length === 0) return '';
        return word.charAt(0).toUpperCase() + word.slice(1);
      })
      .join(' ');
  }
}
