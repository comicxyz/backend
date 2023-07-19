import {
  FastifyPluginCallback,
} from 'fastify';
import fastifyPlugin from 'fastify-plugin';
import scanDirectoryRoute from './scanDirectoryRoute.js';
import chaptersListRoute from './chaptersListRoute.js';
import prepareReadComicRoute from './prepareReadComicRoute.js';
import downloadQueueRoute from './downloadQueueRoute.js';
import getDownloadersRoute from './getDownloadersRoute.js';
import getServiceLogo from './getServiceLogo.js';
import getChaptersToDownloadRoute from './getChaptersToDownloadRoute.js';
import addJobDownloadChaptersRoute from './addJobDownloadChaptersRoute.js';
import downloadDownloaderRoute from './downloadDownloaderRoute.js';
import removeDownloaderRoute from './removeDownloaderRoute.js';
import recordReadingProgressRoute from './recordReadingProgressRoute.js';
import toggleWatchUrlRoute from './toggleWatchUrlRoute.js';

type ObjectionJsFastify = FastifyPluginCallback<ObjectionJsFastifyNs.ObjectionJsFastifyOptions>;

declare namespace ObjectionJsFastifyNs {
  interface ObjectionJsFastifyOptions {
  }
}

function registerRoutes(...[fastify, opts, done] : Parameters<ObjectionJsFastify>) {
  try {
    fastify.post('/scan-directory', scanDirectoryRoute(fastify));
    fastify.get('/chapters', chaptersListRoute(fastify));
    fastify.get('/read-chapter/:chapterId', prepareReadComicRoute(fastify));
    fastify.get('/download-queue', downloadQueueRoute(fastify));
    fastify.get('/services', getDownloadersRoute(fastify));

    fastify.get(
      '/service-logo/:service/:filename',
      getServiceLogo(fastify),
    );

    fastify.post('/get-chapters', getChaptersToDownloadRoute(fastify));

    fastify.post('/add-job-download-chapters', addJobDownloadChaptersRoute(fastify));

    fastify.post('/services', downloadDownloaderRoute(fastify));

    fastify.delete('/services/:downloader', removeDownloaderRoute(fastify));

    fastify.post('/progress/:chapterId/:page/:totalPage', recordReadingProgressRoute(fastify));

    fastify.post('/watch/:id', toggleWatchUrlRoute(fastify));

    done();
  } catch (err) {
    done(err as Error);
  }
}

export default fastifyPlugin(registerRoutes, {
  fastify: '4.x',
  name: 'registerRoutes',
});
