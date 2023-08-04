import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import {
  chaptersQueue,
} from '../workers/Queue.js';

export default function restartJobRoute(app: FastifyInstance) {
  return async (
    request: FastifyRequest<{
      Params: { jobId: string },
    }>,
    reply: FastifyReply,
  ) => {
    const queue = chaptersQueue;
    const job = await queue.getJob(request.params.jobId);

    if (!job) {
      return reply.callNotFound();
    }

    const ignoreLock = true;
    await job.moveToFailed({ message: 'Job restarted by user' }, ignoreLock);
    await job.retry();

    return reply.send({ job });
  };
}
