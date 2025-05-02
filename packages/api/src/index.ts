import Fastify from 'fastify';
import fastifyCors from '@fastify/cors';
import fastifyHelmet from '@fastify/helmet';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import fastifyRequestLogger from '@mgcrea/fastify-request-logger';
import dotenv from 'dotenv';
import { errorHandler } from './middleware/error-handler';
import routes from './routes';
import { initializeDatabase } from './db';
import diPlugin from './plugins/di-plugin';

// Load environment variables
dotenv.config();

// Initialize application
const fastify = Fastify({
  logger: {
    transport: {
      target: 'pino-pretty',
      options: {
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
      },
    },
  },
});

const port: number = parseInt(process.env.PORT || '4000', 10);

// Application startup function
const start = async () => {
  try {
    // Initialize database
    const dbInitialized = await initializeDatabase();
    if (!dbInitialized) {
      fastify.log.error('Failed to initialize database. Exiting...');
      process.exit(1);
    }
    
    // Register plugins
    await fastify.register(fastifyHelmet); // Security
    await fastify.register(fastifyCors); // CORS
    await fastify.register(fastifyRequestLogger); // Logging
    await fastify.register(fastifySwagger, {
      openapi: {
        info: {
          title: 'ErrorHub API',
          description: 'API for centralized error management system',
          version: '0.1.0',
        },
      },
    });
    await fastify.register(fastifySwaggerUi, {
      routePrefix: '/documentation',
    });
    
    // Register DI container
    await fastify.register(diPlugin);
    
    // JSON support is configured by default in Fastify

    // Register error handler
    fastify.setErrorHandler(errorHandler);
    
    // Register routes
    fastify.register(routes, { prefix: '/api' });
    
    // Start server
    await fastify.listen({ port, host: '0.0.0.0' });
    fastify.log.info(`ErrorHub API server is running on port ${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

// Start application
start(); 