import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import ChapterInterface from '../@types/ChapterInterface';
import SeriesInterface from '../@types/SeriesInterface';
import ProcessTitleFunctionInterface from '../@types/ProcessTitleFunctionInterface';
import ClientError from '../plugins/ClientError.js';
import getAllDownloaders from '../utils/getAllDownloaders.js';
import { GetChapterImagesInterface } from '../@types/DownloaderInterfaces';

type AddMangaRequestType = FastifyRequest<{ Body: { url: string } }>;
// type AddWorkerRequestType = FastifyRequest<{ Body: { chapters: ChapterInterface[] } }>;
type GenericReplyType = FastifyReply;

export default function getChaptersToDownloadRoute(app: FastifyInstance) {
  return async (request: AddMangaRequestType, reply: GenericReplyType) => {
    const services = await getAllDownloaders(app.config.DOWNLOADERS_DIR);

    if (request.body.url.startsWith('debugc ')) {
      const url = new URL(request.body.url.split('debugc ')[1]);

      const { host } = url;
      try {
        const serviceDir = services[host];
        const { default: getChapterImages } = await import(`../../${app.config.DOWNLOADERS_DIR}/${serviceDir}/getChapterImages.js`) as { default: GetChapterImagesInterface };
        const chapters: ChapterInterface[] = (
          await getChapterImages(url.toString())).map((text: string) => ({
          seriesTitle: text, seriesUrl: text, title: text, url: text,
        }));

        const series: SeriesInterface = { chapters, title: 'test', url: url.toString() };

        return await reply.send(series);
      } catch (err) {
        const error = err as Error;
        request.log.error({ err, services }, 'Error');
        throw new ClientError({ code: 'ERR_GET_CHAPTERS', message: error.message });
      }
    }

    const url = new URL(request.body.url);
    const { host } = url;
    try {
      const serviceDir = services[host];
      const { default: getChapters } = await import(`../../${app.config.DOWNLOADERS_DIR}/${serviceDir}/getChapters.js`) as { default: ProcessTitleFunctionInterface };
      const chapters = await getChapters(url.toString());
      return await reply.send(chapters);
    } catch (err) {
      const error = err as Error;
      throw new ClientError({ code: 'ERR_GET_CHAPTERS', message: error.message });
    }
  };
}
