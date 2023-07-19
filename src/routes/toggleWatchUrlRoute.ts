import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import dayjs from 'dayjs';
import { watchUrlQueue } from '../workers/Queue.js';

function toggleWatchUrlRoute(app: FastifyInstance) {
  return async (request: FastifyRequest<{
    Params: {
      id: number
    }
  }>, reply: FastifyReply) => {
    const chapter = await app.objection.models.ChaptersModel.query().where('id', request.params.id).first();
    if (chapter === undefined) {
      return reply.callNotFound();
    }

    if (chapter && chapter.website) {
      const repeatableJobs = await watchUrlQueue.getRepeatableJobs();
      const watchedUrls = repeatableJobs.map((j) => j.key.split(':::')[0].replace('__default__:', ''));

      if (watchedUrls.includes(chapter.website)) {
        const index = watchedUrls.indexOf(chapter.website);
        await watchUrlQueue.removeRepeatableByKey(repeatableJobs[index].key);
        request.log.info({ repeatableJobs }, 'Remove repeatable job');
        return reply.send({ isWatched: false });
      }

      await watchUrlQueue.add({ url: chapter?.website }, {
        jobId: chapter.website,
        repeat: {
          cron: `${(dayjs().minute() + 5) % 60} */${dayjs().hour() === 0 ? 24 : dayjs().hour()} * * *`,
        },
      });
      request.log.info({ repeatableJobs }, 'Add repeatable job');
      const repeatableJobsUpdated = await watchUrlQueue.getRepeatableJobs();
      const watchedUrlsUpdated = repeatableJobsUpdated.map((j) => j.key.split(':::')[0].replace('__default__:', ''));

      request.log.info({ watchedUrlsUpdated }, 'watchedUrlsUpdated');

      return reply.send({ isWatched: true });
    }

    return reply.callNotFound();
  };
}
export default toggleWatchUrlRoute;
