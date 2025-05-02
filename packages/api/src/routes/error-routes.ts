import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { NotFoundError } from '../middleware/error-handler';

interface ErrorCodeParams {
  code: string;
}

interface BatchRequestBody {
  codes: string[];
  language?: string;
}

export default async function errorRoutes(fastify: FastifyInstance, options: any) {
  /**
   * @route GET /api/errors/:code
   * @desc Get error information by code
   */
  fastify.get<{ Params: ErrorCodeParams; Querystring: { lang?: string } }>(
    '/:code',
    async (request, reply) => {
      const { code } = request.params;
      const lang = request.query.lang || 'en';
      
      // TODO: Implement error retrieval from service
      
      // Temporary stub for demonstration
      if (code === 'TEST.ERROR') {
        return {
          code,
          message: lang === 'ru' ? 'Тестовая ошибка' : 'Test error',
          locale: lang,
          version: 1
        };
      }
      
      throw new NotFoundError(`Error with code ${code} not found`, 'ERROR.NOT_FOUND');
    }
  );

  /**
   * @route POST /api/errors/batch
   * @desc Get information about multiple errors in one request
   */
  fastify.post<{ Body: BatchRequestBody }>(
    '/batch',
    async (request, reply) => {
      const { codes, language = 'en' } = request.body;
      
      if (!Array.isArray(codes) || codes.length === 0) {
        return reply.status(400).send({
          error: {
            code: 'REQUEST.INVALID',
            message: 'Codes must be a non-empty array'
          }
        });
      }
      
      // TODO: Implement retrieval of errors from service
      
      // Temporary stub for demonstration
      const errors = codes.map(code => ({
        code,
        message: language === 'ru' ? `Ошибка: ${code}` : `Error: ${code}`,
        locale: language,
        version: 1
      }));
      
      return { errors };
    }
  );

  /**
   * @route POST /api/errors
   * @desc Create a new error
   */
  fastify.post(
    '/',
    async (request, reply) => {
      // TODO: Implement error creation
      
      // Temporary stub
      reply.status(201);
      return {
        message: 'Error created successfully',
        data: { ...request.body, id: '123' }
      };
    }
  );

  /**
   * @route PUT /api/errors/:code
   * @desc Update error information
   */
  fastify.put<{ Params: ErrorCodeParams }>(
    '/:code',
    async (request, reply) => {
      const { code } = request.params;
      
      // TODO: Implement error update
      
      // Temporary stub
      return {
        message: 'Error updated successfully',
        data: { code, ...request.body }
      };
    }
  );

  /**
   * @route DELETE /api/errors/:code
   * @desc Delete an error
   */
  fastify.delete<{ Params: ErrorCodeParams }>(
    '/:code',
    async (request, reply) => {
      const { code } = request.params;
      
      // TODO: Implement error deletion
      
      // Temporary stub
      return {
        message: 'Error deleted successfully',
        code
      };
    }
  );
} 