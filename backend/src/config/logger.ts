import pino from 'pino';
import { getEnv } from './env';
import path from 'path';
import fs from 'fs';

const LOG_DIR = path.resolve(process.cwd(), 'logs');

export function createLogger(name: string, logFile?: string) {
  const env = getEnv();
  const streams: pino.StreamEntry[] = [];

  streams.push({
    level: env.LOG_LEVEL,
    stream: pino.transport({
      target: 'pino/file',
      options: { destination: 1 },
    }),
  });

  if (logFile) {
    if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });
    streams.push({
      level: env.LOG_LEVEL,
      stream: pino.transport({
        target: 'pino/file',
        options: { destination: path.join(LOG_DIR, logFile) },
      }),
    });
  }

  return pino(
    {
      name,
      level: env.LOG_LEVEL,
      formatters: {
        level: (label) => ({ level: label }),
      },
    },
    pino.multistream(streams),
  );
}

export const appLogger = createLogger('photovault', 'application.log');
export const securityLogger = createLogger('security', 'security.log');
export const auditLogger = createLogger('audit', 'audit.log');
export const errorLogger = createLogger('error', 'error.log');
