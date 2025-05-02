import { FastifyInstance } from 'fastify';
import { DIContainer } from '../di';

// Import routes groups (will be created later)
import errorRoutes from './errors';
import categoryRoutes from './categories';
import translationRoutes from './translations';

/**
 * Main router function that registers all route groups
 */
export default async function (fastify: FastifyInstance) {
  // Get DI container
  const di = fastify.di as DIContainer;
  
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