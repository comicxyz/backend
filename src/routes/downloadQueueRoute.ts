import Bull, { JobStatus } from 'bull';
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import ChapterInterface from '../@types/ChapterInterface.js';
import {
  chaptersQueue, zipQueue,
} from '../workers/Queue.js';
import generateHashFromZipFilePath from '../utils/generateHashFromZipFilePath.js';

export default function downloadQueueRoute(app: FastifyInstance) {
  return async (
    request: FastifyRequest,
    reply: FastifyReply,
  ) => {
    const status: JobStatus[] = ['active', 'completed', 'delayed', 'failed', 'paused', 'waiting'];
    const jobs: Record<JobStatus, Bull.Job<ChapterInterface>[]> = {
      active: [],
      completed: [],
      delayed: [],
      failed: [],
      paused: [],
      waiting: [],
    };
    await Promise.all(status.map(async (s) => {
      const jobsByType = await chaptersQueue.getJobs([s]);
      jobs[s] = await Promise.all(jobsByType.map(async (job) => {
        const zipJob = await zipQueue.getJob(job.id);
        return {
          ...JSON.parse(JSON.stringify(job)),
          zip: zipJob?.data.outputPath || null,
          readingId: zipJob?.data.outputPath
            ? generateHashFromZipFilePath(zipJob.data.outputPath) : null,
        } as unknown as Bull.Job<ChapterInterface>;
      }));
    }));
    return reply.send({ jobs });
  };
}
