import { z } from 'zod';

export const ProductSchema = z.object({
  name: z.string().describe('The name of the product or equipment'),
  quantity: z.number().int().positive().describe('The quantity of the product or equipment'),
});

export type Product = z.infer<typeof ProductSchema>;

export interface ParsedPage {
  pageNumber: number;
  text: string;
}

export type PageComplexity = 'SIMPLE' | 'COMPLEX';

export interface ExtractionResult {
  products: Product[];
  source: 'REGEX' | 'GPT_API' | 'GPT_CACHE';
  tokensUsed?: number;
  costEstimate?: number;
}

export interface FinalTenderOutput {
  tenderName: string;
  products: Product[];
}
