import { FastifyReply, FastifyRequest } from 'fastify';
import { AlbumService } from './album.service';
import { createAlbumSchema, updateAlbumSchema, albumQuerySchema } from '../../common/schemas/album.schema';
import type { AuthenticatedRequest } from '../../common/types';

const albumService = new AlbumService();

export class AlbumController {
  async create(request: FastifyRequest, reply: FastifyReply) {
    const { userId } = request as AuthenticatedRequest;
    const data = createAlbumSchema.parse(request.body);
    const album = await albumService.create(userId, data);
    return reply.status(201).send(album);
  }

  async findAll(request: FastifyRequest, reply: FastifyReply) {
    const { userId, userRole } = request as AuthenticatedRequest;
    const query = albumQuerySchema.parse(request.query);
    const result = await albumService.findAll(userId, userRole, query);
    return reply.send(result);
  }

  async findById(request: FastifyRequest, reply: FastifyReply) {
    const { userId, userRole } = request as AuthenticatedRequest;
    const { id } = request.params as { id: string };
    const album = await albumService.findById(userId, userRole, id);
    return reply.send(album);
  }

  async update(request: FastifyRequest, reply: FastifyReply) {
    const { userId, userRole } = request as AuthenticatedRequest;
    const { id } = request.params as { id: string };
    const data = updateAlbumSchema.parse(request.body);
    const album = await albumService.update(userId, userRole, id, data);
    return reply.send(album);
  }

  async delete(request: FastifyRequest, reply: FastifyReply) {
    const { userId, userRole } = request as AuthenticatedRequest;
    const { id } = request.params as { id: string };
    await albumService.delete(userId, userRole, id);
    return reply.send({ message: 'Álbum excluído com sucesso' });
  }
}
