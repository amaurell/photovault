import { FastifyInstance } from 'fastify';
import { AuthController } from './auth.controller';
import { authenticate } from '../../common/middleware/auth.middleware';

const controller = new AuthController();

export async function authRoutes(app: FastifyInstance) {
  app.post('/auth/login', controller.login.bind(controller));
  app.post('/auth/register', controller.register.bind(controller));
  app.post('/auth/refresh', controller.refreshToken.bind(controller));
  app.post('/auth/logout', controller.logout.bind(controller));

  app.get('/auth/me', { preHandler: [authenticate] }, controller.me.bind(controller));
  app.put('/auth/password', { preHandler: [authenticate] }, controller.changePassword.bind(controller));
  app.post('/auth/consent', { preHandler: [authenticate] }, controller.consent.bind(controller));
  app.get('/auth/consent', { preHandler: [authenticate] }, controller.consentStatus.bind(controller));
}
