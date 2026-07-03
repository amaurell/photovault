import * as argon2 from 'argon2';
import { getPrisma } from '../../common/database/prisma';
import { getEnv } from '../../config/env';
import { appLogger } from '../../config/logger';

export class AdminService {
  async listUsers() {
    const prisma = getPrisma();
    return prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        active: true,
        createdAt: true,
        role: { select: { name: true, slug: true } },
        _count: { select: { photos: true, albums: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async toggleBlock(userId: string) {
    const prisma = getPrisma();
    const user = await prisma.user.findUnique({ where: { id: userId }, include: { role: true } });
    if (!user) throw new Error('Usuário não encontrado');
    if (user.role?.slug === 'admin') throw new Error('Não é possível bloquear um administrador');

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { active: !user.active },
      select: { id: true, name: true, active: true },
    });
    appLogger.info({ userId, active: updated.active }, 'User block status toggled by admin');
    return updated;
  }

  async deleteUser(userId: string) {
    const prisma = getPrisma();
    const user = await prisma.user.findUnique({ where: { id: userId }, include: { role: true } });
    if (!user) throw new Error('Usuário não encontrado');
    if (user.role?.slug === 'admin') throw new Error('Não é possível excluir um administrador');

    await prisma.$transaction(async (tx) => {
      await tx.favorite.deleteMany({ where: { userId } });
      await tx.photoTag.deleteMany({ where: { photo: { userId } } });
      await tx.photo.deleteMany({ where: { userId } });
      await tx.album.deleteMany({ where: { userId } });
      await tx.sharedLink.deleteMany({ where: { userId } });
      await tx.session.deleteMany({ where: { userId } });
      await tx.auditLog.deleteMany({ where: { userId } });
      await tx.consentLgpd.deleteMany({ where: { userId } });
      await tx.user.delete({ where: { id: userId } });
    });

    appLogger.info({ userId }, 'User deleted by admin');
  }

  async resetPassword(userId: string, newPassword: string) {
    const prisma = getPrisma();
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('Usuário não encontrado');

    const env = getEnv();
    const passwordHash = await argon2.hash(newPassword, {
      type: argon2.argon2id,
      memoryCost: env.ARGON2_MEMORY_COST,
      timeCost: env.ARGON2_TIME_COST,
      parallelism: env.ARGON2_PARALLELISM,
    });

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    appLogger.info({ userId }, 'Password reset by admin');
  }

  async getSchedule() {
    const prisma = getPrisma();
    const schedule = await prisma.accessSchedule.findFirst({ orderBy: { createdAt: 'desc' } });
    return schedule || { startTime: '00:00', endTime: '00:00', enabled: false };
  }

  async updateSchedule(startTime: string, endTime: string, enabled: boolean) {
    const prisma = getPrisma();
    const existing = await prisma.accessSchedule.findFirst({ orderBy: { createdAt: 'desc' } });

    if (existing) {
      return prisma.accessSchedule.update({
        where: { id: existing.id },
        data: { startTime, endTime, enabled },
      });
    }

    return prisma.accessSchedule.create({
      data: { startTime, endTime, enabled },
    });
  }

  isTimeBlocked(schedule: { startTime: string; endTime: string; enabled: boolean }): boolean {
    if (!schedule.enabled) return false;

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const [startH, startM] = schedule.startTime.split(':').map(Number);
    const [endH, endM] = schedule.endTime.split(':').map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    if (startMinutes < endMinutes) {
      return currentMinutes >= startMinutes && currentMinutes < endMinutes;
    }
    // overnight
    return currentMinutes >= startMinutes || currentMinutes < endMinutes;
  }

  async checkAccessBlocked(): Promise<boolean> {
    const schedule = await this.getSchedule();
    return this.isTimeBlocked(schedule);
  }
}
