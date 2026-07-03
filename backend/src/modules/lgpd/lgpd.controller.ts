import { FastifyReply, FastifyRequest } from 'fastify';
import { LgpdService } from './lgpd.service';
import type { AuthenticatedRequest } from '../../common/types';

const lgpdService = new LgpdService();

export class LgpdController {
  async exportData(request: FastifyRequest, reply: FastifyReply) {
    const { userId } = request as AuthenticatedRequest;
    const data = await lgpdService.exportData(userId);
    return reply.send(data);
  }

  async deleteAccount(request: FastifyRequest, reply: FastifyReply) {
    const { userId } = request as AuthenticatedRequest;
    await lgpdService.deleteAccount(userId);
    return reply.send({ message: 'Conta excluída com sucesso' });
  }

  async revokeConsent(request: FastifyRequest, reply: FastifyReply) {
    const { userId } = request as AuthenticatedRequest;
    await lgpdService.revokeConsent(userId);
    return reply.send({ message: 'Consentimento revogado' });
  }
}
