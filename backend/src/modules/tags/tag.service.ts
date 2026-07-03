import { getPrisma } from '../../common/database/prisma';
import { appLogger } from '../../config/logger';

export class TagService {
  async findAll() {
    const prisma = getPrisma();
    const tags = await prisma.tag.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: {
            photos: { where: { photo: { deletedAt: null } } },
          },
        },
      },
    });
    return tags.filter((t) => t._count.photos > 0);
    return tags;
  }

  async findBySlug(slug: string) {
    const prisma = getPrisma();
    const tag = await prisma.tag.findUnique({
      where: { slug },
      include: {
        _count: {
          select: {
            photos: { where: { photo: { deletedAt: null } } },
          },
        },
      },
    });
    if (!tag) throw new Error('Tag não encontrada');
    return tag;
  }

  async cleanup() {
    const prisma = getPrisma();
    const orphaned = await prisma.tag.findMany({
      where: { photos: { none: { photo: { deletedAt: null } } } },
    });
    for (const tag of orphaned) {
      await prisma.photoTag.deleteMany({ where: { tagId: tag.id } });
      await prisma.tag.delete({ where: { id: tag.id } });
    }
    return { deleted: orphaned.length };
  }

  async delete(slug: string) {
    const prisma = getPrisma();
    const tag = await prisma.tag.findUnique({ where: { slug } });
    if (!tag) throw new Error('Tag não encontrada');

    await prisma.photoTag.deleteMany({ where: { tagId: tag.id } });
    await prisma.tag.delete({ where: { id: tag.id } });
    appLogger.info({ tagId: tag.id }, 'Tag deleted');
  }
}
