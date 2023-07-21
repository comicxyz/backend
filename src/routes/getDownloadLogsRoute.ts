import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { chaptersQueue } from '../workers/Queue.js';

export default (app: FastifyInstance) => async (req: FastifyRequest<{
  Params: { jobId: string } }>, res: FastifyReply) => {
  const { jobId } = req.params;
  const job = await chaptersQueue.getJob(jobId);
  if (!job) {
    return res.callNotFound();
  }

  const { logs } = await chaptersQueue.getJobLogs(jobId);

  return res.send({
    logs,
    job,
  });
};
