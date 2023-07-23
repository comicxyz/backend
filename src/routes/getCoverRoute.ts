import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import ChaptersModel from '../models/Chapters';

export default function getCoverRoute(app: FastifyInstance) {
  return async (req: FastifyRequest<{
    Params: { id: string }
  }>, res: FastifyReply) => {
    const { id } = req.params;

    const { base64Thumbnail } = await app.objection.models.ChaptersModel.query()
      .findById(id) as ChaptersModel;

    if (base64Thumbnail) {
      return res.header('Content-Type', 'image/png').send(Buffer.from(base64Thumbnail.split(',')[1], 'base64'));
    }
    return res.callNotFound();
  };
}
