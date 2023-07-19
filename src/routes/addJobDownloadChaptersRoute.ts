import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import ChapterInterface from '../@types/ChapterInterface';
import { chaptersQueue } from '../workers/Queue.js';

type AddWorkerRequestType = FastifyRequest<{ Body: { chapters: ChapterInterface[] } }>;

export default function addJobDownloadChaptersRoute(app: FastifyInstance) {
  return async (request: AddWorkerRequestType, reply: FastifyReply) => {
    chaptersQueue.addBulk(request.body.chapters.map((ch) => ({ data: ch })))
      .catch((err: Error) => request.log.error({ err }));
    return reply.send({});
  };
}
