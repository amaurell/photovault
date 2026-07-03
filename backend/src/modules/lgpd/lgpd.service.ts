import { getPrisma } from '../../common/database/prisma';
import { appLogger } from '../../config/logger';
import fs from 'fs';
import path from 'path';
import { getEnv } from '../../config/env';

export class LgpdService {
  async exportData(userId: string) {
    const prisma = getPrisma();
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        albums: { where: { deletedAt: null }, include: { photos: { where: { deletedAt: null } } } },
        consentLgpd: true,
      },
    });
    if (!user) throw new Error('Usuário não encontrado');

    return {
      user: {
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      },
      albums: user.albums.map((a) => ({
        title: a.title,
        description: a.description,
        photos: a.photos.map((p) => ({
          originalName: p.originalName,
          size: p.size,
          width: p.width,
          height: p.height,
          createdAt: p.createdAt,
        })),
      })),
      consents: user.consentLgpd,
    };
  }

  async deleteAccount(userId: string) {
    const prisma = getPrisma();
    const env = getEnv();
    const uploadPath = path.resolve(env.UPLOAD_PATH);

    const photos = await prisma.photo.findMany({ where: { userId } });
    for (const photo of photos) {
      for (const file of [
        path.join(uploadPath, 'originals', photo.filename),
        path.join(uploadPath, 'previews', `${path.parse(photo.filename).name}-preview.webp`),
        path.join(uploadPath, 'thumbnails', `${path.parse(photo.filename).name}-thumb.webp`),
      ]) {
        if (fs.existsSync(file)) fs.unlinkSync(file);
      }
    }

    await prisma.photoTag.deleteMany({ where: { photo: { userId } } });
    await prisma.favorite.deleteMany({ where: { userId } });
    await prisma.sharedLink.deleteMany({ where: { userId } });
    await prisma.session.deleteMany({ where: { userId } });
    await prisma.auditLog.deleteMany({ where: { userId } });
    await prisma.consentLgpd.deleteMany({ where: { userId } });
    await prisma.photo.deleteMany({ where: { userId } });
    await prisma.album.deleteMany({ where: { userId } });
    await prisma.user.delete({ where: { id: userId } });

    appLogger.info({ userId }, 'Account deleted (LGPD)');
  }

  async revokeConsent(userId: string) {
    const prisma = getPrisma();
    await prisma.consentLgpd.create({
      data: {
        userId,
        accepted: false,
        version: '1.0',
        acceptedAt: new Date(),
      },
    });
    appLogger.info({ userId }, 'LGPD consent revoked');
  }
}
