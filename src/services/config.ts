import { z } from 'zod';
import * as dotenv from 'dotenv';
dotenv.config();

const ConfigSchema = z.object({
  OPENAI_API_KEY: z.string().default('mock-key'),
  CACHE_DIR: z.string().default('./.cache'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
});

type Config = z.infer<typeof ConfigSchema>;

let config: Config;

try {
  config = ConfigSchema.parse({
    OPENAI_API_KEY: process.env.OPENAI_API_KEY || undefined,
    CACHE_DIR: process.env.CACHE_DIR || undefined,
    LOG_LEVEL: process.env.LOG_LEVEL || undefined,
  });
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error('Configuration validation failed:');
    error.errors.forEach((err) => {
      console.error(`- ${err.path.join('.')}: ${err.message}`);
    });
  } else {
    console.error('Unknown configuration load error:', error);
  }
  process.exit(1);
}

export { config };
