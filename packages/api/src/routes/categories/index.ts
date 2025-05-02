import { FastifyInstance } from 'fastify';
import { DIContainer } from '../../di';

// Import route handlers (to be created later)
import getById from './get-by-id';
import getAll from './get-all';
import create from './create';
import update from './update';
import deleteCategory from './delete';

/**
 * Register all category-related routes
 */
export default function (fastify: FastifyInstance, di: DIContainer) {
  // Get category by ID
  getById(fastify, di);
  
  // Get all categories
  getAll(fastify, di);
  
  // Create new category
  create(fastify, di);
  
  // Update category
  update(fastify, di);
  
  // Delete category
  deleteCategory(fastify, di);
} 