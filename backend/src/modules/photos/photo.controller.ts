import { FastifyReply, FastifyRequest } from 'fastify';
import { PhotoService } from './photo.service';
import { photoQuerySchema, movePhotoSchema, addTagsSchema } from '../../common/schemas/photo.schema';
import type { AuthenticatedRequest } from '../../common/types';
import path from 'path';
import fs from 'fs';
import { getEnv } from '../../config/env';

const photoService = new PhotoService();

export class PhotoController {
  async upload(request: FastifyRequest, reply: FastifyReply) {
    const { userId } = request as AuthenticatedRequest;
    const file = await request.file();
    if (!file) return reply.status(400).send({ error: 'Arquivo não enviado' });

    const albumId = file.fields.albumId?.value as string;
    if (!albumId) return reply.status(400).send({ error: 'Álbum não especificado' });

    const caption = file.fields.caption?.value as string | undefined;

    const buffer = await file.toBuffer();
    const photo = await photoService.upload(userId, albumId, {
      filename: file.filename,
      mimetype: file.mimetype,
      data: buffer,
    }, caption);
    return reply.status(201).send(photo);
  }

  async findAll(request: FastifyRequest, reply: FastifyReply) {
    const { userId, userRole } = request as AuthenticatedRequest;
    const query = photoQuerySchema.parse(request.query);
    const result = await photoService.findAll(userId, userRole, query);
    return reply.send(result);
  }

  async findById(request: FastifyRequest, reply: FastifyReply) {
    const { userId, userRole } = request as AuthenticatedRequest;
    const { id } = request.params as { id: string };
    const photo = await photoService.findById(userId, userRole, id);
    return reply.send(photo);
  }

  async move(request: FastifyRequest, reply: FastifyReply) {
    const { userId } = request as AuthenticatedRequest;
    const { id } = request.params as { id: string };
    const data = movePhotoSchema.parse(request.body);
    const photo = await photoService.move(userId, id, data);
    return reply.send(photo);
  }

  async delete(request: FastifyRequest, reply: FastifyReply) {
    const { userId } = request as AuthenticatedRequest;
    const { id } = request.params as { id: string };
    await photoService.delete(userId, id);
    return reply.send({ message: 'Foto excluída com sucesso' });
  }

  async updateCaption(request: FastifyRequest, reply: FastifyReply) {
    const { userId } = request as AuthenticatedRequest;
    const { id } = request.params as { id: string };
    const { caption } = request.body as { caption?: string };
    const photo = await photoService.updateCaption(userId, id, caption ?? '');
    return reply.send(photo);
  }

  async toggleFavorite(request: FastifyRequest, reply: FastifyReply) {
    const { userId } = request as AuthenticatedRequest;
    const { id } = request.params as { id: string };
    const result = await photoService.toggleFavorite(userId, id);
    return reply.send(result);
  }

  async addTags(request: FastifyRequest, reply: FastifyReply) {
    const { userId } = request as AuthenticatedRequest;
    const { id } = request.params as { id: string };
    const data = addTagsSchema.parse(request.body);
    const tags = await photoService.addTags(userId, id, data);
    return reply.send(tags);
  }

  async removeTag(request: FastifyRequest, reply: FastifyReply) {
    const { userId } = request as AuthenticatedRequest;
    const { id, slug } = request.params as { id: string; slug: string };
    await photoService.removeTag(userId, id, slug);
    return reply.send({ message: 'Tag removida' });
  }

  async serveImage(request: FastifyRequest, reply: FastifyReply) {
    const { userId, userRole } = request as AuthenticatedRequest;
    const { id, size } = request.params as { id: string; size: string };

    const photo = await photoService.findById(userId, userRole, id);
    let imageUrl: string;

    if (size === 'thumbnail') imageUrl = photo.thumbnailUrl ?? photo.originalUrl;
    else if (size === 'preview') imageUrl = photo.previewUrl ?? photo.originalUrl;
    else imageUrl = photo.originalUrl;

    if (imageUrl.startsWith('http')) {
      return reply.redirect(302, imageUrl);
    }

    const env = getEnv();
    const fullPath = path.resolve(env.UPLOAD_PATH, imageUrl.replace('/uploads/', ''));

    if (!fs.existsSync(fullPath)) {
      return reply.status(404).send({ error: 'Arquivo não encontrado' });
    }

    return reply.type(photo.mimeType).send(fs.createReadStream(fullPath));
  }
}
