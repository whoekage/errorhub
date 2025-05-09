import { FastifyInstance } from 'fastify';
import { DIContainer } from '@/di';

export default async function(fastify: FastifyInstance, { services }: DIContainer) {
  // GET /api/settings/languages - получить все языки со статусом
  fastify.get('/', async () => {
    return { 
      languages: await services.language.getLanguagesWithStatus()
    };
  });

  // POST /api/settings/languages/:code/enable - включить язык
  fastify.post('/:code/enable', async (request) => {
    const { code } = request.params as { code: string };
    const success = await services.language.enableLanguage(code);
    return { success };
  });

  // POST /api/settings/languages/:code/disable - отключить язык
  fastify.post('/:code/disable', async (request) => {
    const { code } = request.params as { code: string };
    const success = await services.language.disableLanguage(code);
    return { success };
  });

  // GET /api/settings/languages/enabled - получить только включенные
  fastify.get('/enabled', async () => {
    return { 
      enabledLanguages: await services.language.getEnabledLanguages()
    };
  });
} 