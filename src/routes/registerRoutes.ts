import {
  FastifyPluginCallback,
} from 'fastify';
import fastifyPlugin from 'fastify-plugin';
import scanDirectoryRoute from './scanDirectoryRoute.js';
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
import getDownloadLogsRoute from './getDownloadLogsRoute.js';
import getTitleCounts from './getTitleCounts.js';
import getSeriesListRoute from './getSeriesListRoute.js';
import getCoverRoute from './getCoverRoute.js';
import getCronScanDirRoute from './getCronScanDirRoute.js';
import deleteCronScanDirRoute from './deleteCronScanDirRoute.js';
import getCronScanDirJobsRoute from './getCronScanDirJobsRoute.js';
import loadConfig from '../config/loadConfig.js';
import getChaptersListRoute from './getChaptersListRoute.js';
import getWatchedUrl from './getWatchedUrl.js';
import browseComicOnServiceRoute from './browseComicOnServiceRoute.js';
import restartJobRoute from './restartJobRoute.js';

type ObjectionJsFastify = FastifyPluginCallback<ObjectionJsFastifyNs.ObjectionJsFastifyOptions>;

declare namespace ObjectionJsFastifyNs {
  interface ObjectionJsFastifyOptions {
  }
}

function registerRoutes(...[fastify, opts, done] : Parameters<ObjectionJsFastify>) {
  try {
    fastify.get('/scan-directory', getCronScanDirRoute(fastify));
    fastify.post('/scan-directory', scanDirectoryRoute(fastify));
    fastify.get('/scan-directory-jobs', getCronScanDirJobsRoute(fastify));
    fastify.post('/delete-cron-scan-directory', deleteCronScanDirRoute(fastify));
    fastify.get('/default-cron-config', async (req, res) => {
      const config = await loadConfig({ moduleName: 'default-cron-config', log: fastify.log });
      res.send({
        dir: config.MANGA_DIR,
        skipExisting: config.SCAN_DIR_SKIP_EXISTING,
        extractCover: config.SCAN_DIR_EXTRACT_COVER,
        ext: config.SCAN_DIR_EXT,
      });
    });

    fastify.get('/read-chapter/:chapterId', prepareReadComicRoute(fastify));
    fastify.get('/download-queue', downloadQueueRoute(fastify));
    fastify.post('/retry-job/:jobId', restartJobRoute(fastify));
    fastify.post('/progress/:chapterId/:page/:totalPage', recordReadingProgressRoute(fastify));

    fastify.get(
      '/service-logo/:service/:filename',
      getServiceLogo(fastify),
    );

    fastify.get('/count-titles', getTitleCounts(fastify));
    fastify.get('/series-list', getSeriesListRoute(fastify));
    fastify.get('/chapters/:seriesId', getChaptersListRoute(fastify));
    fastify.get('/cover/:id', getCoverRoute(fastify));
    fastify.post('/watch/:id', toggleWatchUrlRoute(fastify));

    fastify.post('/get-chapters', getChaptersToDownloadRoute(fastify));
    fastify.post('/add-job-download-chapters', addJobDownloadChaptersRoute(fastify));
    fastify.get('/download-logs/:jobId', getDownloadLogsRoute(fastify));

    fastify.get('/services', getDownloadersRoute(fastify));
    fastify.get('/services/:downloader', browseComicOnServiceRoute(fastify));
    fastify.post('/services', downloadDownloaderRoute(fastify));
    fastify.delete('/services/:downloader', removeDownloaderRoute(fastify));

    fastify.get('/watched-urls', getWatchedUrl(fastify));
    done();
  } catch (err) {
    done(err as Error);
  }
}

export default fastifyPlugin(registerRoutes, {
  fastify: '4.x',
  name: 'registerRoutes',
});
