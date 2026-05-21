import * as dotenv from 'dotenv';
dotenv.config();

const LOG_LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

type LogLevel = keyof typeof LOG_LEVELS;

const currentLevel: LogLevel = (process.env.LOG_LEVEL?.toLowerCase() as LogLevel) || 'info';

function log(level: LogLevel, message: string, ...args: any[]) {
  if (LOG_LEVELS[level] >= (LOG_LEVELS[currentLevel] ?? 1)) {
    const timestamp = new Date().toISOString();
    const formattedMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
    if (level === 'error') {
      console.error(formattedMessage, ...args);
    } else if (level === 'warn') {
      console.warn(formattedMessage, ...args);
    } else {
      console.log(formattedMessage, ...args);
    }
  }
}

export const logger = {
  debug: (msg: string, ...args: any[]) => log('debug', msg, ...args),
  info: (msg: string, ...args: any[]) => log('info', msg, ...args),
  warn: (msg: string, ...args: any[]) => log('warn', msg, ...args),
  error: (msg: string, ...args: any[]) => log('error', msg, ...args),
};
