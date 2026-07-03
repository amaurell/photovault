import { FastifyInstance } from 'fastify';
import { SharedController } from './shared.controller';
import { authenticate } from '../../common/middleware/auth.middleware';

const controller = new SharedController();

export async function sharedRoutes(app: FastifyInstance) {
  app.post('/shared/albums/:albumId', { preHandler: [authenticate] }, controller.createLink.bind(controller));
  app.get('/shared/list', { preHandler: [authenticate] }, controller.listLinks.bind(controller));
  app.delete('/shared/:id', { preHandler: [authenticate] }, controller.revokeLink.bind(controller));
  app.get('/shared/token/:token', controller.getLink.bind(controller));
}
