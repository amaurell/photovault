import { FastifyReply, FastifyRequest } from 'fastify';
import { AuthService } from './auth.service';
import {
  loginSchema,
  registerSchema,
  changePasswordSchema,
  consentSchema,
} from '../../common/schemas/auth.schema';
import type { AuthenticatedRequest } from '../../common/types';
import { getEnv } from '../../config/env';

const REFRESH_COOKIE = 'refreshToken';

const authService = new AuthService();

function setRefreshCookie(reply: FastifyReply, token: string) {
  const isProd = getEnv().NODE_ENV === 'production';
  reply.setCookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'strict',
    path: '/api/auth',
    maxAge: 7 * 24 * 60 * 60,
  });
}

function clearRefreshCookie(reply: FastifyReply) {
  reply.clearCookie(REFRESH_COOKIE, { path: '/api/auth' });
}

function getRefreshToken(request: FastifyRequest): string | null {
  const fromCookie = request.cookies?.[REFRESH_COOKIE];
  if (fromCookie) return fromCookie;
  const fromBody = request.body as { refreshToken?: string };
  return fromBody?.refreshToken || null;
}

export class AuthController {
  async login(request: FastifyRequest, reply: FastifyReply) {
    const data = loginSchema.parse(request.body);
    const ip = request.ip;
    const ua = request.headers['user-agent'];
    const result = await authService.login(data, ip, ua);
    setRefreshCookie(reply, result.refreshToken);
    return reply.send(result);
  }

  async register(request: FastifyRequest, reply: FastifyReply) {
    const data = registerSchema.parse(request.body);
    const result = await authService.register(data);
    return reply.status(201).send(result);
  }

  async refreshToken(request: FastifyRequest, reply: FastifyReply) {
    const token = getRefreshToken(request);
    if (!token) return reply.status(400).send({ error: 'Refresh token não fornecido' });
    const result = await authService.refreshToken(token);
    setRefreshCookie(reply, result.refreshToken);
    return reply.send(result);
  }

  async logout(request: FastifyRequest, reply: FastifyReply) {
    const token = getRefreshToken(request);
    if (token) await authService.logout(token);
    clearRefreshCookie(reply);
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
