import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

export default (app: FastifyInstance) => async (req: FastifyRequest<{
  Params: { jobId: string } }>, res: FastifyReply) => {
  const data = await app.objection.models.ChaptersModel.query()
    .select(
      app.objection.knex.raw('letter_group as letter'),
      app.objection.knex.raw('COUNT(*) AS count'),
    )
    .from((qb) => {
      qb.distinct('series_title', 'letter_group')
        .from('chapters')
        .as('TB');
    })
    .groupBy('letter_group')
    .orderBy('letter_group', 'asc');

  req.log.info({ data });

  return res.send({ letterGroups: data });
};
