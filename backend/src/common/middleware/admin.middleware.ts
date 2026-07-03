import { FastifyReply, FastifyRequest } from 'fastify';
import type { AuthenticatedRequest } from '../types';

export async function requireAdmin(request: FastifyRequest, reply: FastifyReply) {
  const role = (request as AuthenticatedRequest).userRole;
  if (role !== 'admin') {
    return reply.status(403).send({ error: 'Acesso restrito a administradores' });
  }
}
