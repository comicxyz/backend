import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

function recordReadingProgressRoute(app: FastifyInstance) {
  return async (req: FastifyRequest<{
    Params: {
      chapterId: number;
      page: number;
      totalPage: number;
    }
  }>, res: FastifyReply) => {
    const progress = Math.ceil((req.params.page * 100) / req.params.totalPage);
    const update = app.objection.models.ReadingProgressModel.query();
    const result = await update.where({ chapterId: req.params.chapterId }).update({
      chapterId: req.params.chapterId,
      currentPage: req.params.page,
      progress,
      updatedAt: new Date(),
    });

    app.log.info(result);

    if (result === 0) {
      const insert = app.objection.models.ReadingProgressModel.query();
      app.log.info('Inserting new record');
      await insert.insert({
        chapterId: req.params.chapterId,
        currentPage: req.params.page,
        progress,
        startedAt: new Date(),
      });
    }

    return res.send({});
  };
}

export default recordReadingProgressRoute;
