import type { FastifyInstance } from 'fastify';
import { studyRoutes } from './study';
import { cmsRoutes } from './cms';
import { dictionaryRoutes } from './dictionary';
import { dashboardRoutes } from './dashboard';

export function registerRoutes(app: FastifyInstance) {
  app.register(studyRoutes, { prefix: '/api' });
  app.register(cmsRoutes, { prefix: '/api' });
  app.register(dictionaryRoutes, { prefix: '/api' });
  app.register(dashboardRoutes, { prefix: '/api' });
}
