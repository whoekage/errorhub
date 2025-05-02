import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import { validationPlugin } from '@/utils/validation/fastify-zod';

/**
 * Plugin to register validation middleware
 */
const validationPluginRegistration: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // Register Zod validation
  await fastify.register(validationPlugin);
  
  // Optionally add additional validation-related functionality here
  fastify.log.info('Zod validation plugin registered');
};

export default fp(validationPluginRegistration, {
  name: 'validation-plugin'
}); 