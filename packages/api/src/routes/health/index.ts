import { FastifyInstance } from 'fastify';
import { DIContainer } from '@/di';

import healthCheck from './health';
import readinessCheck from './ready';


export const healthCheckRoute = (fastify: FastifyInstance, di: DIContainer) => healthCheck(fastify, di);
export const readinessCheckRoute = (fastify: FastifyInstance, di: DIContainer) => readinessCheck(fastify, di);

