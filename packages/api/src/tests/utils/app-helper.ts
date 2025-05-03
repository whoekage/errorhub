import Fastify, { FastifyInstance } from 'fastify';
import { DIContainer } from '@/di';
import { testContainer } from './test-di';

/**
 * Create a test Fastify instance with the real routes
 * @param options Test options
 */
export async function buildTestApp(options: {
  di?: DIContainer;
  withPlugins?: boolean;
  withRoutes?: boolean;
} = {}): Promise<FastifyInstance> {
  // Default options
  const {
    di = testContainer,
    withPlugins = true,
    withRoutes = true
  } = options;

  // Create a fresh Fastify instance for testing
  const app = Fastify({
    logger: false // Disable logging in tests
  });

  // Decorate with DI container only if it doesn't exist yet
  if (!app.hasDecorator('di')) {
    app.decorate('di', di);
  }

  // Register plugins if needed
  if (withPlugins) {
    const { errorHandler } = await import('@/middleware/error-handler');
    app.setErrorHandler(errorHandler);
    
    // Пропускаем регистрацию di-plugin, так как мы уже добавили декоратор
    // const diPlugin = await import('@/plugins/di-plugin');
    // await app.register(diPlugin.default);
    
    const validationPlugin = await import('@/plugins/validation-plugin');
    await app.register(validationPlugin.default);
  }

  // Register routes if needed
  if (withRoutes) {
    const errorRoutes = await import('@/routes/error-routes');
    await app.register(errorRoutes.default, { prefix: '/api/errors' });
    
    // Add other routes as needed
  }

  return app;
}

/**
 * Create a test Fastify app with a specific route handler directly
 * This is useful for testing a single route in isolation
 */
export async function buildTestAppWithRoute(
  routeHandler: (fastify: FastifyInstance, container: DIContainer) => void | Promise<void>,
  options: {
    di?: DIContainer;
    prefix?: string;
    withPlugins?: boolean;
  } = {}
): Promise<FastifyInstance> {
  // Default options
  const {
    di = testContainer,
    prefix = '',
    withPlugins = true
  } = options;

  // Create base app without routes
  const app = await buildTestApp({
    di,
    withPlugins,
    withRoutes: false
  });

  // Register the specific route handler
  await app.register(async (instance) => {
    await routeHandler(instance, di);
  }, { prefix });

  return app;
} 