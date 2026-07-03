import crypto from 'crypto';
import { getPrisma } from '../../common/database/prisma';
import { appLogger } from '../../config/logger';

export class SharedService {
  async createLink(userId: string, albumId: string, expiresInDays?: number) {
    const prisma = getPrisma();
    const album = await prisma.album.findFirst({
      where: { id: albumId, userId, deletedAt: null },
    });
    if (!album) throw new Error('Álbum não encontrado');

    const token = crypto.randomBytes(32).toString('hex');
    const link = await prisma.sharedLink.create({
      data: {
        token,
        userId,
        albumId,
        expiresAt: expiresInDays
          ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
          : null,
      },
    });

    appLogger.info({ linkId: link.id, userId }, 'Shared link created');
    return link;
  }

  async getLink(token: string) {
    const prisma = getPrisma();
    const link = await prisma.sharedLink.findUnique({
      where: { token },
      include: {
        album: {
          include: {
            photos: {
              where: { deletedAt: null },
              take: 50,
            },
          },
        },
        user: { select: { name: true } },
      },
    });

    if (!link || !link.active || (link.expiresAt && link.expiresAt < new Date())) {
      throw new Error('Link inválido ou expirado');
    }

    return link;
  }

  async revokeLink(userId: string, linkId: string) {
    const prisma = getPrisma();
    const link = await prisma.sharedLink.findFirst({
      where: { id: linkId, userId },
    });
    if (!link) throw new Error('Link não encontrado');

    await prisma.sharedLink.update({
      where: { id: linkId },
      data: { active: false },
    });
    appLogger.info({ linkId, userId }, 'Shared link revoked');
  }

  async listLinks(userId: string) {
    const prisma = getPrisma();
    return prisma.sharedLink.findMany({
      where: { userId, active: true },
      include: {
        album: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
