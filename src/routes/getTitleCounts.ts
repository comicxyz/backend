import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

export default (app: FastifyInstance) => async (req: FastifyRequest<{
  Params: { jobId: string } }>, res: FastifyReply) => {
  const data = await app.objection.knex.raw(`
    SELECT letter_group as letter,
        COUNT(*) AS count
        FROM (
    SELECT
        DISTINCT series_title,
        letter_group
    FROM
        chapters) TB 
    GROUP BY letter_group
    ORDER BY letter_group ASC`);

  return res.send({ letterGroups: data.rows });
};
