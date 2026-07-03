import { FastifyInstance } from 'fastify';
import { AlbumController } from './album.controller';
import { authenticate } from '../../common/middleware/auth.middleware';

const controller = new AlbumController();

export async function albumRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate);

  app.post('/albums', controller.create.bind(controller));
  app.get('/albums', controller.findAll.bind(controller));
  app.get('/albums/:id', controller.findById.bind(controller));
  app.put('/albums/:id', controller.update.bind(controller));
  app.delete('/albums/:id', controller.delete.bind(controller));
}
