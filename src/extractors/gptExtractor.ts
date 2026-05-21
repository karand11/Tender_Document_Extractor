import OpenAI from 'openai';
import { config } from '../services/config';
import { Product, ProductSchema } from '../types';
import { logger } from '../services/logger';
import { zodResponseFormat } from 'openai/helpers/zod';
import { z } from 'zod';

const ExtractionResponseSchema = z.object({
  products: z.array(ProductSchema),
});

export class GptExtractor {
  private openai: OpenAI | null = null;

  constructor() {
    const isMock = !config.OPENAI_API_KEY || 
                   config.OPENAI_API_KEY === 'mock-key' || 
                   config.OPENAI_API_KEY.includes('your_openai') || 
                   config.OPENAI_API_KEY === 'your_openai_api_key_here';
                   
    if (!isMock) {
      this.openai = new OpenAI({
        apiKey: config.OPENAI_API_KEY,
      });
    }
  }

  async extract(text: string): Promise<{ products: Product[]; tokensUsed: number }> {
    if (!this.openai) {
      logger.warn('OpenAI API Key is not set or is using mock-key. Returning empty product list.');
      return { products: [], tokensUsed: 0 };
    }

    logger.info('Calling OpenAI API for structured product extraction...');
    
    try {
      const response = await this.openai.beta.chat.completions.parse({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert procurement assistant. Extract a list of products/equipment and their required quantities from the government tender page text. Ignore general requirements, terms, compliance rules, or services. Only extract concrete physical products.',
          },
          {
            role: 'user',
            content: text,
          },
        ],
        response_format: zodResponseFormat(ExtractionResponseSchema, 'extraction'),
      });

      const parsedContent = response.choices[0]?.message?.parsed;
      const tokensUsed = response.usage?.total_tokens || 0;

      if (!parsedContent || !parsedContent.products) {
        logger.warn('OpenAI returned empty or unparseable structured response.');
        return { products: [], tokensUsed };
      }

      logger.info(`Successfully extracted ${parsedContent.products.length} products using GPT (Tokens used: ${tokensUsed}).`);
      return { products: parsedContent.products, tokensUsed };
    } catch (error) {
      logger.error('Error calling OpenAI API:', error);
      throw error;
    }
  }
}
