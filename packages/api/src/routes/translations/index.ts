import { FastifyInstance } from 'fastify';
import { DIContainer } from '../../di';

// Import route handlers (to be created later)
import getByErrorCode from './get-by-error-code';
import getByLanguage from './get-by-language';
import upsert from './upsert';
import deleteTranslation from './delete';

/**
 * Register all translation-related routes
 */
export default function (fastify: FastifyInstance, di: DIContainer) {
  // Get translations by error code
  getByErrorCode(fastify, di);
  
  // Get translations by language
  getByLanguage(fastify, di);
  
  // Create or update translation
  upsert(fastify, di);
  
  // Delete translation
  deleteTranslation(fastify, di);
} 