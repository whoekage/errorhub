import { FastifyInstance } from 'fastify';
import { DIContainer } from '@/di';

// Import routes groups
import errorRoutes from './errors';
import categoryRoutes from './categories';
import translationRoutes from './translations';
import { healthCheckRoute, readinessCheckRoute } from './health';

/**
 * Main router function that registers all route groups
 */
export default async function (fastify: FastifyInstance) {
  // Get DI container
  const di = fastify.di as DIContainer;
  
  // Register health check routes
  fastify.register((instance, opts, done) => {
    healthCheckRoute(instance, di);
    done();
  }, { prefix: '/health' });
  
  // Register readiness check as a separate route
  fastify.register((instance, opts, done) => {
    readinessCheckRoute(instance, di);
    done();
  }, { prefix: '/ready' });
  
  // Register error code routes
  fastify.register((instance, opts, done) => {
    errorRoutes(instance, di);
    done();
  }, { prefix: '/errors' });
  
  // Register category routes
  fastify.register((instance, opts, done) => {
    categoryRoutes(instance, di);
    done();
  }, { prefix: '/categories' });
  
  // Register translation routes
  fastify.register((instance, opts, done) => {
    translationRoutes(instance, di);
    done();
  }, { prefix: '/translations' });
} 