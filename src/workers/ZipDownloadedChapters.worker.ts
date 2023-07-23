import { rimraf } from 'rimraf';
import zip from '../utils/zip.js';
import { addChapterToDbQueue, zipQueue } from './Queue.js';
import { onFailedZipChapter, onFinishedZipChapter, onStartedZipChapter } from './hooks.js';
import BaseLogger from '../@types/BaseLogger.js';
import loadConfig from '../config/loadConfig.js';

export default function ZipDownloadedChapters(args: { log: BaseLogger }) {
  const logger = args.log.child({ worker: 'ZipDownloadedChapters' });
  logger.info('Worker started');

  zipQueue.process(async (job) => {
    const log = logger.child({ jobId: job.id });
    log.info('Zipping ', job.data.targetDirPath);

    onStartedZipChapter(job)
      .catch((errHook) => {
        log.error({ err: errHook }, 'Failed hook onZipChapterStarted');
      });

    return zip(
      job.data.targetDirPath,
      job.data.outputPath,
    );
  })
    .catch((err) => {
      args.log.error(err);
      throw err;
    });

  zipQueue.on('completed', async (job) => {
    const log = args.log.child({ jobId: job.id });
    log.info('Finished zip', job.data.outputPath);
    rimraf(job.data.targetDirPath).then(() => {
      log.info('Removed temp folder', job.data.targetDirPath);
    });

    const config = await loadConfig({ moduleName: 'ZipDownloadedChapters', log });

    await addChapterToDbQueue.add({
      filePath: job.data.outputPath,
      extractCover: config.SCAN_DIR_EXTRACT_COVER,
    });

    try {
      await onFinishedZipChapter(job);
    } catch (errHook) {
      log.error({ err: errHook }, 'Failed hook onZipChapterFinished');
    }
  });

  zipQueue.on('failed', async (job, err) => {
    const log = logger.child({ jobId: job.id });
    log.error({ err }, 'Failed zip %s', job.data.outputPath);

    try {
      await onFailedZipChapter(err, job);
    } catch (errHook) {
      log.error({ err: errHook }, 'Failed hook onZipChapterFailed');
    }
  });
}
