import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { readFile } from 'fs/promises';
import path from 'path';

export default function getServiceLogo(app: FastifyInstance) {
  return async (request: FastifyRequest<{
    Params: { service: string, filename: string } }>, reply: FastifyReply) => {
    const { service } = request.params;
    try {
      const content = await readFile(path.join(
        app.config.DOWNLOADERS_DIR,
        service,
        request.params.filename,
      ));
      if (request.params.filename.endsWith('.jpeg') || request.params.filename.endsWith('.jpg')) {
        return await reply.header('Content-Type', 'image/jpeg').send(content);
      }

      return await reply.header('Content-Type', 'image/png').send(content);
    } catch (err) {
      app.log.error({ err: err as Error }, 'No image for %s', request.params.service);
      const content = await readFile(path.join('..', 'services', 'NoImage.jpeg'));
      return reply.header('Content-Type', 'image/jpeg').send(content);
    }
  };
}
