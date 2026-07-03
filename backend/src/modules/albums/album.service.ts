import path from 'path';
import { getPrisma } from '../../common/database/prisma';
import { appLogger } from '../../config/logger';
import type { CreateAlbumInput, UpdateAlbumInput, AlbumQueryInput } from '../../common/schemas/album.schema';
import { Prisma } from '@prisma/client';
import { createStorageProvider } from '../../common/services/storage.service';

const storage = createStorageProvider();

export class AlbumService {
  async create(userId: string, data: CreateAlbumInput) {
    const prisma = getPrisma();
    const album = await prisma.album.create({
      data: { ...data, userId },
    });
    appLogger.info({ albumId: album.id, userId }, 'Album created');
    return album;
  }

  async findAll(userId: string, userRole: string, query: AlbumQueryInput) {
    const prisma = getPrisma();
    const targetUserId = userRole === 'admin' && query.userId ? query.userId : userId;
    const where: Prisma.AlbumWhereInput = {
      userId: targetUserId,
      deletedAt: null,
    };

    if (query.search) {
      where.title = { contains: query.search, mode: 'insensitive' };
    }

    const [albums, total] = await Promise.all([
      prisma.album.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        include: { _count: { select: { photos: true } } },
      }),
      prisma.album.count({ where }),
    ]);

    return {
      data: albums,
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  async findById(userId: string, userRole: string, id: string) {
    const prisma = getPrisma();
    const where: Prisma.AlbumWhereInput = { id, deletedAt: null };
    if (userRole !== 'admin') where.userId = userId;

    const album = await prisma.album.findFirst({
      where,
      include: {
        _count: { select: { photos: true } },
        photos: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!album) throw new Error('Álbum não encontrado');
    return album;
  }

  async update(userId: string, id: string, data: UpdateAlbumInput) {
    const prisma = getPrisma();
    const album = await prisma.album.findFirst({
      where: { id, userId, deletedAt: null },
    });
    if (!album) throw new Error('Álbum não encontrado');

    const updated = await prisma.album.update({
      where: { id },
      data,
    });
    appLogger.info({ albumId: id, userId }, 'Album updated');
    return updated;
  }

  async delete(userId: string, id: string) {
    const prisma = getPrisma();
    const album = await prisma.album.findFirst({
      where: { id, userId, deletedAt: null },
    });
    if (!album) throw new Error('Álbum não encontrado');

    const photos = await prisma.photo.findMany({ where: { albumId: id } });
    for (const photo of photos) {
      const baseName = path.parse(photo.filename).name;
      await storage.delete(photo.filename);
      await storage.delete(`${baseName}-preview.webp`);
      await storage.delete(`${baseName}-thumb.webp`);
    }
    await prisma.photoTag.deleteMany({ where: { photo: { albumId: id } } });
    await prisma.favorite.deleteMany({ where: { photo: { albumId: id } } });
    await prisma.photo.deleteMany({ where: { albumId: id } });
    await prisma.album.delete({ where: { id } });
    appLogger.info({ albumId: id, userId }, 'Album deleted');
  }
}
