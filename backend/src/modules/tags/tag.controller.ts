import { FastifyReply, FastifyRequest } from 'fastify';
import { TagService } from './tag.service';

const tagService = new TagService();

export class TagController {
  async findAll(_request: FastifyRequest, reply: FastifyReply) {
    const tags = await tagService.findAll();
    return reply.send(tags);
  }

  async findBySlug(request: FastifyRequest, reply: FastifyReply) {
    const { slug } = request.params as { slug: string };
    const tag = await tagService.findBySlug(slug);
    return reply.send(tag);
  }

  async delete(request: FastifyRequest, reply: FastifyReply) {
    const { slug } = request.params as { slug: string };
    await tagService.delete(slug);
    return reply.send({ message: 'Tag excluída com sucesso' });
  }
}
