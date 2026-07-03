import { FastifyReply, FastifyRequest } from 'fastify';
import { AuthService } from './auth.service';
import {
  loginSchema,
  registerSchema,
  changePasswordSchema,
  refreshTokenSchema,
  consentSchema,
} from '../../common/schemas/auth.schema';
import type { AuthenticatedRequest } from '../../common/types';

const authService = new AuthService();

export class AuthController {
  async login(request: FastifyRequest, reply: FastifyReply) {
    const data = loginSchema.parse(request.body);
    const ip = request.ip;
    const ua = request.headers['user-agent'];
    const result = await authService.login(data, ip, ua);
    return reply.send(result);
  }

  async register(request: FastifyRequest, reply: FastifyReply) {
    const data = registerSchema.parse(request.body);
    const result = await authService.register(data);
    return reply.status(201).send(result);
  }

  async refreshToken(request: FastifyRequest, reply: FastifyReply) {
    const data = refreshTokenSchema.parse(request.body);
    const result = await authService.refreshToken(data.refreshToken);
    return reply.send(result);
  }

  async logout(request: FastifyRequest, reply: FastifyReply) {
    const data = refreshTokenSchema.parse(request.body);
    await authService.logout(data.refreshToken);
    return reply.send({ message: 'Logout realizado com sucesso' });
  }

  async me(request: FastifyRequest, reply: FastifyReply) {
    const { userId } = request as AuthenticatedRequest;
    const { getPrisma } = await import('../../common/database/prisma');
    const prisma = getPrisma();
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });
    if (!user) return reply.status(404).send({ error: 'Usuário não encontrado' });
    return reply.send({
      id: user.id,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
      role: user.role.slug,
    });
  }

  async changePassword(request: FastifyRequest, reply: FastifyReply) {
    const { userId } = request as AuthenticatedRequest;
    const data = changePasswordSchema.parse(request.body);
    await authService.changePassword(userId, data);
    return reply.send({ message: 'Senha alterada com sucesso' });
  }

  async consent(request: FastifyRequest, reply: FastifyReply) {
    const { userId } = request as AuthenticatedRequest;
    const data = consentSchema.parse(request.body);
    await authService.recordConsent(userId, data);
    return reply.send({ message: 'Consentimento registrado' });
  }

  async consentStatus(request: FastifyRequest, reply: FastifyReply) {
    const { userId } = request as AuthenticatedRequest;
    const consent = await authService.getConsentStatus(userId);
    return reply.send({ hasConsent: !!consent?.accepted, consent });
  }
}
