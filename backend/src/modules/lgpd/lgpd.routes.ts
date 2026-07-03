import { FastifyInstance } from 'fastify';
import { LgpdController } from './lgpd.controller';
import { authenticate } from '../../common/middleware/auth.middleware';

const controller = new LgpdController();

export async function lgpdRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate);

  app.get('/lgpd/export', controller.exportData.bind(controller));
  app.delete('/lgpd/account', controller.deleteAccount.bind(controller));
  app.post('/lgpd/revoke-consent', controller.revokeConsent.bind(controller));
}
