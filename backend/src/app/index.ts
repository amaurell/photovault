import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import multipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import path from 'path';
import { loadEnv, getEnv } from '../config/env';
import { appLogger, errorLogger, securityLogger } from '../config/logger';
import { authRoutes } from '../modules/auth/auth.routes';
import { albumRoutes } from '../modules/albums/album.routes';
import { photoRoutes } from '../modules/photos/photo.routes';
import { tagRoutes } from '../modules/tags/tag.routes';
import { lgpdRoutes } from '../modules/lgpd/lgpd.routes';
import { sharedRoutes } from '../modules/shared/shared.routes';
import { adminRoutes } from '../modules/admin/admin.routes';

loadEnv();
const env = getEnv();

export async function buildApp(opts?: { serverless?: boolean }) {
  const app = Fastify({
    logger: appLogger,
    bodyLimit: env.MAX_FILE_SIZE,
  });

  await app.register(helmet, {
    contentSecurityPolicy: env.NODE_ENV === 'production' ? undefined : false,
    crossOriginResourcePolicy: { policy: 'same-origin' },
  });

  await app.register(cors, {
    origin: env.FRONTEND_URL,
    credentials: true,
  });

  if (!opts?.serverless) {
    await app.register(rateLimit, {
      max: env.NODE_ENV === 'production' ? 60 : 300,
      timeWindow: '1 minute',
    });
  }

  await app.register(multipart, {
    limits: {
      fileSize: env.MAX_FILE_SIZE,
      files: 10,
    },
  });

  const uploadPath = path.resolve(env.UPLOAD_PATH);
  await app.register(fastifyStatic, {
    root: uploadPath,
    prefix: '/uploads/',
    decorateReply: false,
    schemaHide: true,
  });

  if (env.NODE_ENV === 'development' && !opts?.serverless) {
    await app.register(fastifySwagger, {
      openapi: {
        info: {
          title: 'PhotoVault API',
          description: 'API de gerenciamento de fotos pessoais',
          version: '1.0.0',
        },
        servers: [{ url: env.APP_URL }],
      },
    });
    await app.register(fastifySwaggerUi, {
      routePrefix: '/docs',
    });
  }

  app.setErrorHandler((error, _request, reply) => {
    errorLogger.error({ err: error }, error.message);

    if (error.validation) {
      return reply.status(400).send({
        error: 'Erro de validação',
        details: error.validation.map((v: any) => v.message),
      });
    }

    if (error.statusCode === 429) {
      securityLogger.warn({ ip: _request.ip }, 'Rate limit exceeded');
    }

    const statusCode = error.statusCode || 500;
    const isDev = env.NODE_ENV === 'development';
    return reply.status(statusCode).send({
      error: isDev ? error.message : (statusCode === 500 ? 'Erro interno do servidor' : error.message),
    });
  });

  app.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

  app.get('/robots.txt', async (_req, reply) => {
    return reply.type('text/plain').send('User-agent: *\nDisallow: /\n');
  });

  await app.register(authRoutes);
  await app.register(albumRoutes);
  await app.register(photoRoutes);
  await app.register(tagRoutes);
  await app.register(lgpdRoutes);
  await app.register(sharedRoutes);
  await app.register(adminRoutes);

  return app;
}
