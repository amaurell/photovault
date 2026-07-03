import { FastifyReply, FastifyRequest } from 'fastify';
import { SharedService } from './shared.service';
import type { AuthenticatedRequest } from '../../common/types';

const sharedService = new SharedService();

export class SharedController {
  async createLink(request: FastifyRequest, reply: FastifyReply) {
    const { userId } = request as AuthenticatedRequest;
    const { albumId } = request.params as { albumId: string };
    const { expiresInDays } = request.body as { expiresInDays?: number };
    const link = await sharedService.createLink(userId, albumId, expiresInDays);
    return reply.status(201).send(link);
  }

  async getLink(request: FastifyRequest, reply: FastifyReply) {
    const { token } = request.params as { token: string };
    const link = await sharedService.getLink(token);
    return reply.send(link);
  }

  async revokeLink(request: FastifyRequest, reply: FastifyReply) {
    const { userId } = request as AuthenticatedRequest;
    const { id } = request.params as { id: string };
    await sharedService.revokeLink(userId, id);
    return reply.send({ message: 'Link revogado' });
  }

  async listLinks(request: FastifyRequest, reply: FastifyReply) {
    const { userId } = request as AuthenticatedRequest;
    const links = await sharedService.listLinks(userId);
    return reply.send(links);
  }
}
