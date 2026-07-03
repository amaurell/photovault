import * as argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import { getEnv } from '../../config/env';
import { getPrisma } from '../../common/database/prisma';
import { appLogger, securityLogger } from '../../config/logger';
import type { LoginInput, RegisterInput, ChangePasswordInput, ConsentInput } from '../../common/schemas/auth.schema';

const LOGIN_MAX_ATTEMPTS = 5;
const LOGIN_BLOCK_DURATION = 15 * 60 * 1000;

interface TokenPayload {
  userId: string;
  role: string;
}

export class AuthService {
  async login(data: LoginInput, ipAddress?: string, userAgent?: string) {
    const prisma = getPrisma();
    const user = await prisma.user.findUnique({
      where: { email: data.email },
      include: { role: true },
    });

    if (!user || !user.active) {
      securityLogger.warn({ email: data.email, ip: ipAddress }, 'login_failed_user_not_found');
      throw new Error('Credenciais inválidas');
    }

    const recentAttempts = await prisma.auditLog.count({
      where: {
        userId: user.id,
        action: 'login_failed',
        createdAt: { gte: new Date(Date.now() - LOGIN_BLOCK_DURATION) },
      },
    });

    if (recentAttempts >= LOGIN_MAX_ATTEMPTS) {
      securityLogger.warn({ userId: user.id, ip: ipAddress }, 'login_blocked_too_many_attempts');
      throw new Error('Conta temporariamente bloqueada. Tente novamente em 15 minutos.');
    }

    const valid = await argon2.verify(user.passwordHash, data.password);
    if (!valid) {
      await prisma.auditLog.create({
        data: {
          action: 'login_failed',
          entity: 'user',
          entityId: user.id,
          userId: user.id,
        },
      });
      securityLogger.warn({ userId: user.id, ip: ipAddress }, 'login_failed_wrong_password');
      throw new Error('Credenciais inválidas');
    }

    const tokens = this.generateTokens({ userId: user.id, role: user.role.slug });

    await prisma.session.create({
      data: {
        userId: user.id,
        refreshToken: tokens.refreshToken,
        userAgent: userAgent || null,
        ipAddress: ipAddress || null,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    await prisma.auditLog.create({
      data: {
        action: 'login',
        entity: 'user',
        entityId: user.id,
        userId: user.id,
      },
    });

    appLogger.info({ userId: user.id }, 'User logged in successfully');

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
        role: user.role.slug,
      },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async register(data: RegisterInput) {
    const prisma = getPrisma();
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      throw new Error('Email já cadastrado');
    }

    const passwordHash = await this.hashPassword(data.password);
    const userRole = await prisma.role.findUnique({ where: { slug: 'user' } });
    if (!userRole) throw new Error('Role user not found');

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash,
        roleId: userRole.id,
      },
      include: { role: true },
    });

    appLogger.info({ userId: user.id }, 'User registered');
    return { id: user.id, name: user.name, email: user.email, role: user.role.slug };
  }

  async refreshToken(refreshToken: string) {
    const prisma = getPrisma();
    const env = getEnv();

    let payload: TokenPayload;
    try {
      payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as TokenPayload;
    } catch {
      throw new Error('Refresh token inválido ou expirado');
    }

    const session = await prisma.session.findUnique({
      where: { refreshToken },
      include: { user: { include: { role: true } } },
    });

    if (!session || session.revokedAt || session.expiresAt < new Date()) {
      throw new Error('Sessão inválida ou expirada');
    }

    await prisma.session.update({
      where: { id: session.id },
      data: { revokedAt: new Date() },
    });

    const tokens = this.generateTokens({ userId: session.user.id, role: session.user.role.slug });

    await prisma.session.create({
      data: {
        userId: session.user.id,
        refreshToken: tokens.refreshToken,
        userAgent: session.userAgent,
        ipAddress: session.ipAddress,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    appLogger.info({ userId: session.user.id }, 'Token refreshed');
    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async logout(refreshToken: string) {
    const prisma = getPrisma();
    const session = await prisma.session.findUnique({ where: { refreshToken } });
    if (session) {
      await prisma.session.update({
        where: { id: session.id },
        data: { revokedAt: new Date() },
      });
      appLogger.info({ userId: session.userId }, 'User logged out');
    }
  }

  async changePassword(userId: string, data: ChangePasswordInput) {
    const prisma = getPrisma();
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('Usuário não encontrado');

    const valid = await argon2.verify(user.passwordHash, data.currentPassword);
    if (!valid) throw new Error('Senha atual incorreta');

    const passwordHash = await this.hashPassword(data.newPassword);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    await prisma.session.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    appLogger.info({ userId }, 'Password changed');
  }

  async recordConsent(userId: string, data: ConsentInput) {
    const prisma = getPrisma();
    await prisma.consentLgpd.create({
      data: {
        userId,
        accepted: data.accepted,
        version: data.version,
        acceptedAt: new Date(),
      },
    });
    appLogger.info({ userId }, 'LGPD consent recorded');
  }

  async getConsentStatus(userId: string) {
    const prisma = getPrisma();
    const consent = await prisma.consentLgpd.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return consent;
  }

  private generateTokens(payload: TokenPayload) {
    const env = getEnv();
    const accessToken = jwt.sign(payload, env.JWT_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
    return { accessToken, refreshToken };
  }

  private async hashPassword(password: string): Promise<string> {
    return argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: Number(process.env.ARGON2_MEMORY_COST) || 19456,
      timeCost: Number(process.env.ARGON2_TIME_COST) || 2,
      parallelism: Number(process.env.ARGON2_PARALLELISM) || 1,
    });
  }
}
