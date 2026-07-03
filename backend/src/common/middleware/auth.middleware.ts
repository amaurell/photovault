import { FastifyReply, FastifyRequest } from 'fastify';
import jwt from 'jsonwebtoken';
import { getEnv } from '../../config/env';
import type { AuthenticatedRequest } from '../types';

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  const authHeader = request.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return reply.status(401).send({ error: 'Token não fornecido' });
  }

  const token = authHeader.substring(7);
  try {
    const env = getEnv();
    const payload = jwt.verify(token, env.JWT_SECRET) as { userId: string; role: string };
    (request as AuthenticatedRequest).userId = payload.userId;
    (request as AuthenticatedRequest).userRole = payload.role;
  } catch {
    return reply.status(401).send({ error: 'Token inválido ou expirado' });
  }
}
