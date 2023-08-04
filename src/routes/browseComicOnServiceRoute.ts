import { FastifyReply, FastifyRequest } from 'fastify';
import { GetComicListFunctionType } from '../@types/DownloaderInterfaces';

export default async (req: FastifyRequest<{
  Params: { downloader: string },
  Querystring: { page: number, search: string } }>, res: FastifyReply) => {
  const { default: fn } = await import(`../downloaders/${req.params.downloader}/getComics.js`) as { default: GetComicListFunctionType };
  const page = req.query.page || 1;
  const search = req.query.search || '';
  res.send({ comics: await fn({ page, search }) });
};
