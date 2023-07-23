import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import getWatchedUrlsAsArray from '../utils/getWatchedUrls.js';

export default (app: FastifyInstance) => async (req: FastifyRequest<{
  Querystring: { letterGroup: string,
    title: string } }>, res: FastifyReply) => {
  const { letterGroup, title: searchTitle } = req.query;

  if (letterGroup === 'watched') {
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
  }

  const all = await app.objection.models.SeriesModel.query()
    .select(
      app.objection.knex.min('id').as('id'),
      'series_title',
      app.objection.knex.count('id').as('count'),
    )
    .where((qb) => {
      if (letterGroup) {
        qb.where('letter_group', letterGroup.toUpperCase());
      }

      if (searchTitle) {
        qb.whereRaw(`lower(series_title) like '%${searchTitle.toLowerCase()}%'`);
      }
    })
    .groupBy('series_title')
    .orderBy('series_title', 'asc');

  return res.send({ series: all });
};
