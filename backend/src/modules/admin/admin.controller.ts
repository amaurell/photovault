import { FastifyReply, FastifyRequest } from 'fastify';
import { AdminService } from './admin.service';
import type { AuthenticatedRequest } from '../../common/types';

const adminService = new AdminService();

export class AdminController {
  async listUsers(_request: FastifyRequest, reply: FastifyReply) {
    const users = await adminService.listUsers();
    return reply.send(users);
  }

  async toggleBlock(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const result = await adminService.toggleBlock(id);
    return reply.send(result);
  }

  async deleteUser(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    await adminService.deleteUser(id);
    return reply.send({ message: 'Usuário excluído' });
  }

  async resetPassword(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const { password } = request.body as { password: string };
    if (!password || password.length < 6) {
      return reply.status(400).send({ error: 'Senha deve ter no mínimo 6 caracteres' });
    }
    await adminService.resetPassword(id, password);
    return reply.send({ message: 'Senha redefinida' });
  }

  async getSchedule(_request: FastifyRequest, reply: FastifyReply) {
    const schedule = await adminService.getSchedule();
    return reply.send(schedule);
  }

  async updateSchedule(request: FastifyRequest, reply: FastifyReply) {
    const { startTime, endTime, enabled } = request.body as {
      startTime: string;
      endTime: string;
      enabled: boolean;
    };
    const schedule = await adminService.updateSchedule(startTime, endTime, enabled);
    return reply.send(schedule);
  }

  async checkAccess(_request: FastifyRequest, reply: FastifyReply) {
    const blocked = await adminService.checkAccessBlocked();
    return reply.send({ blocked });
  }
}
