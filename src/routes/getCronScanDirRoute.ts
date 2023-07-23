import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { cronScanDirQueue } from '../workers/Queue.js';

export default (app: FastifyInstance) => async (req: FastifyRequest<{
  Params: { jobId: string } }>, res: FastifyReply) => {
  const repJobs = await cronScanDirQueue.getRepeatableJobs();
  const delayedJobs = await cronScanDirQueue.getJobs(['delayed']);
  const pastJobs = await cronScanDirQueue.getJobs(['completed', 'failed']);

  const cronJobs = await Promise.all(repJobs.map(async (cron) => {
    const job = delayedJobs.find((delayed) => (delayed.opts.repeat as unknown as {
      key: string }).key === cron.key);
    const pastJob = pastJobs.filter((past) => (past.opts.repeat as unknown as {
      key: string }).key === cron.key);

    if (job) {
      return {
        key: cron.key,
        name: cron.name,
        id: cron.id,
        cron: cron.cron,
        data: job.data,
        pastJobs: pastJob,
      };
    }

    return null;
  }));
  return res.send({ cronJobs });
};
