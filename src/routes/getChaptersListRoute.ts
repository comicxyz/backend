import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import getWatchedUrlsAsArray from '../utils/getWatchedUrls.js';

export default (app: FastifyInstance) => async (req: FastifyRequest<{
  Params: {
    seriesId: number,
  }
  Querystring: {
    limit: number,
  } }>, res: FastifyReply) => {
  const repeatableJobs = await getWatchedUrlsAsArray();
  req.log.info({ repeatableJobs }, 'Watched URL(s)');

  const series = await app.objection.models.ChaptersModel.query().findById(req.params.seriesId);

  if (!series) {
    return res.callNotFound();
  }

  const chapters = await app.objection.models.ChaptersModel.query()
    .select('id', 'volume', 'chapterTitle', 'publishedAt', 'createdAt', 'updatedAt', 'website')
    .where('seriesTitle', series?.seriesTitle)
    .orderBy('volume', 'asc')
    .orderBy('publishedAt', 'asc');

  return res.send({
    series,
    chapters,
    isWatched: series.website ? repeatableJobs.includes(series.website) : false,
  });
};
