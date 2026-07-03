import type { VercelRequest, VercelResponse } from '@vercel/node';
import { buildApp } from '../backend/src/app/index';

let app: Awaited<ReturnType<typeof buildApp>> | null = null;

const API_PREFIX = '/api';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!app) {
    app = await buildApp({ serverless: true });
    await app.ready();
  }

  // Strip /api prefix from URL so Fastify routes match correctly
  if (req.url?.startsWith(API_PREFIX)) {
    req.url = req.url.slice(API_PREFIX.length) || '/';
  }

  await new Promise<void>((resolve, reject) => {
    res.on('finish', resolve);
    res.on('error', reject);
    app!.server.emit('request', req as any, res as any);
  });
}

export const config = {
  api: {
    bodyParser: false,
    externalResolver: true,
  },
};
