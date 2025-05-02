import { FastifyInstance } from 'fastify';
import { NotFoundError } from '../middleware/error-handler';
import {
  CreateErrorCodeDto,
  UpdateErrorCodeDto
} from '../dto/error-code.dto';

interface ErrorCodeParams {
  code: string;
}

/**
 * Error code routes
 */
export default async function (fastify: FastifyInstance) {
  const { errorCode } = fastify.di.repositories;
  
  /**
   * @route GET /api/errors
   * @desc Get all error codes
   */
  fastify.get('/', async () => {
    return errorCode.findAll();
  });

  /**
   * @route GET /api/errors/:code
   * @desc Get error information by code
   */
  fastify.get<{ Params: ErrorCodeParams; Querystring: { lang?: string } }>(
    '/:code',
    {
      schema: {
        params: {
          type: 'object',
          properties: {
            code: { type: 'string' }
          },
          required: ['code']
        },
        querystring: {
          type: 'object',
          properties: {
            lang: { type: 'string' }
          }
        }
      }
    },
    async (request) => {
      const { code } = request.params;
      const lang = request.query.lang || 'en';
      
      const errorCodeData = await errorCode.findByCode(code, {
        relations: ['category', 'translations']
      });
      
      if (!errorCodeData) {
        throw new NotFoundError(`Error with code ${code} not found`, 'ERROR.NOT_FOUND');
      }
      
      // Find translation for requested language
      const translation = errorCodeData.translations.find(t => t.language === lang);
      
      return {
        code: errorCodeData.code,
        category: {
          id: errorCodeData.category.id,
          name: errorCodeData.category.name
        },
        message: translation ? translation.message : errorCodeData.defaultMessage,
        locale: translation ? lang : 'default',
        createdAt: errorCodeData.createdAt,
        updatedAt: errorCodeData.updatedAt
      };
    }
  );

  /**
   * @route POST /api/errors
   * @desc Create a new error
   */
  fastify.post<{ Body: CreateErrorCodeDto }>(
    '/',
    {
      schema: {
        body: {
          type: 'object',
          required: ['code', 'categoryId', 'defaultMessage']
        }
      }
    },
    async (request, reply) => {
      try {
        const newErrorCode = await errorCode.create(request.body);
        return reply.code(201).send(newErrorCode);
      } catch (error) {
        return reply.code(400).send({ error: 'Could not create error code' });
      }
    }
  );

  /**
   * @route PUT /api/errors/:code
   * @desc Update error information
   */
  fastify.put<{ Params: ErrorCodeParams; Body: UpdateErrorCodeDto }>(
    '/:code',
    {
      schema: {
        params: {
          type: 'object',
          properties: {
            code: { type: 'string' }
          },
          required: ['code']
        }
      }
    },
    async (request, reply) => {
      const { code } = request.params;
      const updatedErrorCode = await errorCode.update(code, request.body);
      
      if (!updatedErrorCode) {
        return reply.code(404).send({ error: 'Error code not found' });
      }
      
      return updatedErrorCode;
    }
  );

  /**
   * @route DELETE /api/errors/:code
   * @desc Delete an error
   */
  fastify.delete<{ Params: ErrorCodeParams }>(
    '/:code',
    {
      schema: {
        params: {
          type: 'object',
          properties: {
            code: { type: 'string' }
          },
          required: ['code']
        }
      }
    },
    async (request, reply) => {
      const { code } = request.params;
      const deleted = await errorCode.delete(code);
      
      if (!deleted) {
        return reply.code(404).send({ error: 'Error code not found' });
      }
      
      return reply.code(204).send();
    }
  );
} 