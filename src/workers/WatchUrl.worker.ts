import { Knex } from 'knex';
import BaseLogger from '../@types/BaseLogger.js';
import ProcessTitleFunctionInterface from '../@types/ProcessTitleFunctionInterface.js';
import getAllDownloaders from '../utils/getAllDownloaders.js';
import { chaptersQueue, watchUrlQueue } from './Queue.js';
import { models } from '../models/knex.config.js';

export default (app: {
  log: BaseLogger,
  models: typeof models,
  knex: Knex,
  dir: string,
}) => {
  const logger = app.log.child({ worker: 'WatchUpdates' });

  logger.info('Worker started');

  watchUrlQueue.getRepeatableJobs().then((jobs) => {
    app.log.info({ jobs }, 'Watched URL(s)');
  });

  watchUrlQueue.process(async (job) => {
    const log = logger.child({ watchUrlJobId: job.id });
    const url = new URL(job.data.url);
    log.info({ url: url.toString() }, 'Start job');

    const { host } = url;
    const services = await getAllDownloaders(app.dir);

    const serviceDir = services[host];

    if (serviceDir === undefined) {
      log.error('No downloaders found for %s', host);
      throw new Error(`No downloaders found for ${host}`);
    }

    const { default: getChapters } = await import(`../../${app.dir}/${serviceDir}/getChapters.js`) as { default: ProcessTitleFunctionInterface };
    const { chapters } = await getChapters(url.toString());

    const query = app.models.ChaptersModel.query();

    const downloaded = await query
      .where('website', job.data.url);

    const downloadOnlyNewChapters = true;
    let chaptersToDownload = [];

    if (downloadOnlyNewChapters) {
      const titleOnlyDownloadedChapters = downloaded.map((c) => c.chapterTitle);
      const lastDownloadedIndex = chapters.map(
        (c) => titleOnlyDownloadedChapters.includes(c.title),
      ).reduce((acc, cur, index) => (cur ? index : acc), 0);
      chaptersToDownload = chapters.slice(lastDownloadedIndex + 1);
    } else {
      chaptersToDownload = chapters.filter((c) => {
        const found = downloaded.find((d) => d.chapterTitle === c.title);
        return !found;
      });
    }

    app.log.debug({
      chapters: chapters.map((c) => c.title),
      downloaded: downloaded.map((c) => c.chapterTitle),
      chaptersToDownload: chaptersToDownload.map((c) => c.title),
    }, 'Chapters');

    if (chaptersToDownload.length > 0) {
      log.info('Add %d chapters to download queue', chaptersToDownload.length);
      return chaptersQueue.addBulk(chaptersToDownload.map((ch) => ({ data: ch })));
    }
    return null;
  })
    .catch((err) => {
      logger.error({ err: err as Error });
      throw err;
    });

  watchUrlQueue.on('completed', (job) => {
    logger.info('Completed job (ID: %s)', job.id);
  });

  watchUrlQueue.on('failed', (job, err) => {
    logger.error({ err }, 'Failed job (ID: %s)', job.id);
  });
};
