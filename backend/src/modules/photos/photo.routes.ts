import { FastifyInstance } from 'fastify';
import { PhotoController } from './photo.controller';
import { authenticate } from '../../common/middleware/auth.middleware';

const controller = new PhotoController();

export async function photoRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate);

  app.post('/photos/upload', controller.upload.bind(controller));
  app.get('/photos', controller.findAll.bind(controller));
  app.get('/photos/:id', controller.findById.bind(controller));
  app.put('/photos/:id/caption', controller.updateCaption.bind(controller));
  app.put('/photos/:id/move', controller.move.bind(controller));
  app.delete('/photos/:id', controller.delete.bind(controller));
  app.post('/photos/:id/favorite', controller.toggleFavorite.bind(controller));
  app.post('/photos/:id/tags', controller.addTags.bind(controller));
  app.delete('/photos/:id/tags/:slug', controller.removeTag.bind(controller));
  app.get('/photos/:id/serve/:size?', controller.serveImage.bind(controller));
}
