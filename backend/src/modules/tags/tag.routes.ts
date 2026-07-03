import { FastifyInstance } from 'fastify';
import { TagController } from './tag.controller';
import { authenticate } from '../../common/middleware/auth.middleware';

const controller = new TagController();

export async function tagRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate);

  app.get('/tags', controller.findAll.bind(controller));
  app.get('/tags/:slug', controller.findBySlug.bind(controller));
  app.delete('/tags/:slug', controller.delete.bind(controller));
}
