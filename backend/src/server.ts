import { buildApp } from './app/index';
import { getEnv } from './config/env';
import { appLogger } from './config/logger';
import { disconnectPrisma } from './common/database/prisma';
import { syncAdminUser } from './common/sync-admin';

async function start() {
  const app = await buildApp({ serverless: false });
  const env = getEnv();

  try {
    await syncAdminUser();
    await app.listen({
      port: env.PORT,
      host: '0.0.0.0',
    });
    appLogger.info(`Server running on ${env.APP_URL}`);
  } catch (err) {
    appLogger.fatal({ err }, 'Failed to start server');
    process.exit(1);
  }

  const shutdown = async (signal: string) => {
    appLogger.info(`Received ${signal}, shutting down...`);
    await app.close();
    await disconnectPrisma();
    process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

start();
