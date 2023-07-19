import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import path from 'path';
import { rimraf } from 'rimraf';

export default function removeDownloaderRoute(app: FastifyInstance) {
  return async (
    request: FastifyRequest<{
      Params: {
        downloader: string;
      }
    }>,
    reply: FastifyReply,
  ) => {
    const { downloader } = request.params;
    await rimraf(path.join('.', app.config.DOWNLOADERS_DIR, downloader));
    return reply.setApi({ code: 'DL_REMOVED', message: 'Downloader removed' }).send({});
  };
}
