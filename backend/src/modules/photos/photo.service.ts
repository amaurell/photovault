import path from 'path';
import { getPrisma } from '../../common/database/prisma';
import { appLogger } from '../../config/logger';
import type { PhotoQueryInput, MovePhotoInput, AddTagsInput } from '../../common/schemas/photo.schema';
import { Prisma } from '@prisma/client';
import { createStorageProvider, processImage } from '../../common/services/storage.service';

const storage = createStorageProvider();

export class PhotoService {
  async upload(
    userId: string,
    albumId: string,
    file: { filename: string; mimetype: string; data: Buffer },
    caption?: string,
  ) {
    const prisma = getPrisma();

    const album = await prisma.album.findFirst({
      where: { id: albumId, userId, deletedAt: null },
    });
    if (!album) throw new Error('Álbum não encontrado');

    const ext = path.extname(file.filename) || '.jpg';
    const baseName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

    const { original, preview, thumbnail } = await processImage(file.data, file.filename);

    const originalFilename = `${baseName}${ext}`;
    const previewFilename = `${baseName}-preview.webp`;
    const thumbnailFilename = `${baseName}-thumb.webp`;

    const originalUrl = await storage.save(originalFilename, original);
    const previewUrl = await storage.save(previewFilename, preview);
    const thumbnailUrl = await storage.save(thumbnailFilename, thumbnail);

    const metadata = await import('sharp').then((s) => s.default(file.data).metadata());

    const photo = await prisma.photo.create({
      data: {
        filename: originalFilename,
        originalName: file.filename,
        caption: caption || null,
        mimeType: file.mimetype,
        size: file.data.length,
        width: metadata.width || null,
        height: metadata.height || null,
        originalUrl,
        previewUrl,
        thumbnailUrl,
        albumId,
        userId,
      },
    });

    appLogger.info({ photoId: photo.id, userId }, 'Photo uploaded');
    return photo;
  }

  async findAll(userId: string, userRole: string, query: PhotoQueryInput) {
    const prisma = getPrisma();
    const targetUserId = userRole === 'admin' && query.userId ? query.userId : userId;
    const where: Prisma.PhotoWhereInput = {
      userId: targetUserId,
      deletedAt: null,
    };

    if (query.albumId) where.albumId = query.albumId;
    if (query.search) {
      where.originalName = { contains: query.search, mode: 'insensitive' };
    }
    if (query.tag) {
      where.tags = { some: { tag: { slug: query.tag } } };
    }
    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) where.createdAt.gte = new Date(query.startDate);
      if (query.endDate) where.createdAt.lte = new Date(query.endDate);
    }
    if (query.favorite) {
      where.favorites = { some: { userId } };
    }

    const orderBy: Prisma.PhotoOrderByWithRelationInput = {};
    if (query.sortBy === 'name') orderBy.originalName = query.sortOrder;
    else if (query.sortBy === 'size') orderBy.size = query.sortOrder;
    else orderBy.createdAt = query.sortOrder;

    const [photos, total] = await Promise.all([
      prisma.photo.findMany({
        where,
        orderBy,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        include: {
          album: { select: { id: true, title: true } },
          tags: { include: { tag: true } },
          favorites: { where: { userId }, select: { id: true } },
        },
      }),
      prisma.photo.count({ where }),
    ]);

    const data = photos.map((p) => ({
      ...p,
      tags: p.tags.map((pt) => pt.tag),
      isFavorited: p.favorites.length > 0,
      favorites: undefined,
    }));

    return {
      data,
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
    const where: Prisma.PhotoWhereInput = { id, deletedAt: null };
    if (userRole !== 'admin') where.userId = userId;

    const photo = await prisma.photo.findFirst({
      where,
      include: {
        album: { select: { id: true, title: true } },
        tags: { include: { tag: true } },
        favorites: { where: { userId }, select: { id: true } },
      },
    });
    if (!photo) throw new Error('Foto não encontrada');
    return {
      ...photo,
      tags: photo.tags.map((pt) => pt.tag),
      isFavorited: photo.favorites.length > 0,
      favorites: undefined,
    };
  }

  async move(userId: string, id: string, data: MovePhotoInput) {
    const prisma = getPrisma();
    const photo = await prisma.photo.findFirst({
      where: { id, userId, deletedAt: null },
    });
    if (!photo) throw new Error('Foto não encontrada');

    const album = await prisma.album.findFirst({
      where: { id: data.albumId, userId, deletedAt: null },
    });
    if (!album) throw new Error('Álbum de destino não encontrado');

    const updated = await prisma.photo.update({
      where: { id },
      data: { albumId: data.albumId },
    });
    appLogger.info({ photoId: id, userId }, 'Photo moved');
    return updated;
  }

  async delete(userId: string, id: string) {
    const prisma = getPrisma();
    const photo = await prisma.photo.findFirst({
      where: { id, userId, deletedAt: null },
    });
    if (!photo) throw new Error('Foto não encontrada');

    await prisma.photoTag.deleteMany({ where: { photoId: id } });
    await prisma.favorite.deleteMany({ where: { photoId: id } });
    await prisma.photo.delete({ where: { id } });

    const baseName = path.parse(photo.filename).name;
    await storage.delete(photo.filename);
    await storage.delete(`${baseName}-preview.webp`);
    await storage.delete(`${baseName}-thumb.webp`);

    appLogger.info({ photoId: id, userId }, 'Photo deleted');
  }

  async updateCaption(userId: string, photoId: string, caption: string) {
    const prisma = getPrisma();
    const photo = await prisma.photo.findFirst({
      where: { id: photoId, userId, deletedAt: null },
    });
    if (!photo) throw new Error('Foto não encontrada');
    return prisma.photo.update({
      where: { id: photoId },
      data: { caption: caption || null },
    });
  }

  async toggleFavorite(userId: string, photoId: string) {
    const prisma = getPrisma();
    const existing = await prisma.favorite.findUnique({
      where: { userId_photoId: { userId, photoId } },
    });

    if (existing) {
      await prisma.favorite.delete({ where: { id: existing.id } });
      return { favorited: false };
    }

    await prisma.favorite.create({ data: { userId, photoId } });
    return { favorited: true };
  }

  async addTags(userId: string, photoId: string, data: AddTagsInput) {
    const prisma = getPrisma();
    const photo = await prisma.photo.findFirst({
      where: { id: photoId, userId, deletedAt: null },
    });
    if (!photo) throw new Error('Foto não encontrada');

    for (const tagName of data.tags) {
      const slug = tagName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const tag = await prisma.tag.upsert({
        where: { slug },
        update: {},
        create: { name: tagName, slug },
      });

      await prisma.photoTag.upsert({
        where: { photoId_tagId: { photoId, tagId: tag.id } },
        update: {},
        create: { photoId, tagId: tag.id },
      });
    }

    appLogger.info({ photoId, userId }, 'Tags added');
    const photoWithTags = await prisma.photo.findUnique({
      where: { id: photoId },
      include: { tags: { include: { tag: true } } },
    });
    return photoWithTags?.tags.map((pt) => pt.tag) || [];
  }

  async removeTag(userId: string, photoId: string, tagSlug: string) {
    const prisma = getPrisma();
    const photo = await prisma.photo.findFirst({
      where: { id: photoId, userId, deletedAt: null },
    });
    if (!photo) throw new Error('Foto não encontrada');

    const tag = await prisma.tag.findUnique({ where: { slug: tagSlug } });
    if (!tag) throw new Error('Tag não encontrada');

    await prisma.photoTag.deleteMany({
      where: { photoId, tagId: tag.id },
    });

    const remaining = await prisma.photoTag.count({ where: { tagId: tag.id } });
    if (remaining === 0) {
      await prisma.tag.delete({ where: { id: tag.id } });
    }

    appLogger.info({ photoId, userId, tag: tagSlug }, 'Tag removed');
  }
}
