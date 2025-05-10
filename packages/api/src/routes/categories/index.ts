import { FastifyInstance } from 'fastify';
import { DIContainer } from '@/di';

// Import route handlers (to be created later)
import getById from './get-by-id';
import getAll from './get-all';
import upsert from './upsert';
import deleteCategory from './delete';
import update from './update';

/**
 * Register all category-related routes
 */
export default function (fastify: FastifyInstance, di: DIContainer) {
  // Get category by ID
  getById(fastify, di);
  
  // Get all categories
  getAll(fastify, di);
  
  // Update category
  update(fastify, di);

  // Create category
  upsert(fastify, di);
  
  // Delete category
  deleteCategory(fastify, di);
} 