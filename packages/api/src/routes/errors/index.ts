import { FastifyInstance } from 'fastify';
import { DIContainer } from '@/di';

// Import route handlers (will be created later)
import getByCode from './get-by-code';
import getAll from './get-all';
import create from './create';
import update from './update';
import deleteError from './delete';
import getByCategory from './get-by-category';

/**
 * Register all error-related routes
 */
export default function (fastify: FastifyInstance, di: DIContainer) {
  // Get error by code
  getByCode(fastify, di);
  
  // Get all errors
  getAll(fastify, di);
  
  // Create new error
  create(fastify, di);
  
  // Update error
  update(fastify, di);
  
  // Delete error
  deleteError(fastify, di);
  
  // Get errors by category
  getByCategory(fastify, di);
} 