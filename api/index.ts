import type { VercelRequest, VercelResponse } from '@vercel/node';
import { buildApp } from '../backend/src/app/index';

let app: Awaited<ReturnType<typeof buildApp>> | null = null;

const API_PREFIX = '/api';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!app) {
    app = await buildApp({ serverless: true });
    await app.ready();
  }

  if (req.url?.startsWith(API_PREFIX)) {
    req.url = req.url.slice(API_PREFIX.length) || '/';
  }

  res.setHeader('X-RateLimit-Limit', '60');
  res.setHeader('X-RateLimit-Window', '1 minute');

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
