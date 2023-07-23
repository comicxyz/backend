import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import getWatchedUrlsAsArray from '../utils/getWatchedUrls.js';

export default (app: FastifyInstance) => async (req: FastifyRequest, res: FastifyReply) => {
  const repeatableJobs = await getWatchedUrlsAsArray();

  const series = await app.objection.models.ChaptersModel.query()
    .select(
      app.objection.knex.min('id').as('id'),
      'series_title',
      app.objection.knex.count('id').as('count'),
    )
    .groupBy('series_title')
    .orderBy('series_title', 'asc')
    .whereIn('website', repeatableJobs);

  return res.send({
    series,
  });
};
