import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { GetComicListFunctionType, GetInfoFunctionType } from '../@types/DownloaderInterfaces';

export default function getDownloadersRoute(app: FastifyInstance) {
  return async (req: FastifyRequest<{
    Params: { downloader: string },
    Querystring: { page: number, search: string, category: string } }>, res: FastifyReply) => {
    const { default: getInfo } = await import(`../../${app.config.DOWNLOADERS_DIR}/${req.params.downloader}/getInfo.js`) as { default: GetInfoFunctionType };
    const { default: fn } = await import(`../downloaders/${req.params.downloader}/getComics.js`) as { default: GetComicListFunctionType };
    const page = req.query.page || 1;
    const search = req.query.search || '';
    const category = req.query.category || '';
    res.send({ info: getInfo(), comics: await fn({ page, search, category }) });
  };
}
