import { FastifyInstance } from 'fastify';
import { AdminController } from './admin.controller';
import { authenticate } from '../../common/middleware/auth.middleware';
import { requireAdmin } from '../../common/middleware/admin.middleware';

const controller = new AdminController();

export async function adminRoutes(app: FastifyInstance) {
  app.get('/admin/users', { preHandler: [authenticate, requireAdmin] }, controller.listUsers.bind(controller));
  app.patch('/admin/users/:id/toggle-block', { preHandler: [authenticate, requireAdmin] }, controller.toggleBlock.bind(controller));
  app.delete('/admin/users/:id', { preHandler: [authenticate, requireAdmin] }, controller.deleteUser.bind(controller));
  app.patch('/admin/users/:id/reset-password', { preHandler: [authenticate, requireAdmin] }, controller.resetPassword.bind(controller));
  app.get('/admin/schedule', { preHandler: [authenticate, requireAdmin] }, controller.getSchedule.bind(controller));
  app.put('/admin/schedule', { preHandler: [authenticate, requireAdmin] }, controller.updateSchedule.bind(controller));
  app.get('/auth/access-check', controller.checkAccess.bind(controller));
}
