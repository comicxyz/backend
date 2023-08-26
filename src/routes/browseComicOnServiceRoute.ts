import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { AxiosError } from 'axios';
import { GetComicListFunctionType, GetInfoFunctionType } from '../@types/DownloaderInterfaces';
import ServerError from '../plugins/ServerError.js';

export default function getDownloadersRoute(app: FastifyInstance) {
  return async (req: FastifyRequest<{
    Params: { downloader: string },
    Querystring: { page: number, search: string, category: string } }>, res: FastifyReply) => {
    const { default: getInfo } = await import(`../../${app.config.DOWNLOADERS_DIR}/${req.params.downloader}/getInfo.js`) as { default: GetInfoFunctionType };
    const { default: fn } = await import(`../downloaders/${req.params.downloader}/getComics.js`) as { default: GetComicListFunctionType };
    const page = req.query.page || 1;
    const search = req.query.search || '';
    const category = req.query.category || '';
    try {
      const comics = await fn({ page, search, category });
      res.send({ info: getInfo(), comics });
    } catch (err) {
      const axiosError = err as AxiosError;

      if (axiosError.isAxiosError) {
        throw new ServerError({
          code: `ERR_BROWSE_COMICS_${axiosError.response?.status}` as Uppercase<string>,
          message: `Cannot browse comics (Encounter HTTP Error ${axiosError.response?.status}${axiosError.response?.statusText && `: ${axiosError.response?.statusText}`})`,
        });
      }

      throw new ServerError({
        code: 'ERR_BROWSE_COMICS' as Uppercase<string>,
        message: `Cannot browse comics (${axiosError.message})`,
      });
    }
  };
}
