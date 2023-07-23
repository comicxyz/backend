import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import Bull from 'bull';
import { cronScanDirQueue } from '../workers/Queue.js';

export default (app: FastifyInstance) => async (req: FastifyRequest<{
  Querystring: { status: string } }>, res: FastifyReply) => {
  let status: Bull.JobStatus[] = [];
  if (req.query.status === 'done') {
    status = ['completed', 'failed'];
  } else status = [req.query.status as Bull.JobStatus];
  const jobs = await cronScanDirQueue.getJobs(status);
  return res.send({ jobs });
};
