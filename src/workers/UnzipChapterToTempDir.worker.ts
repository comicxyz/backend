import path from 'path';
import { unzipChapterToTempDirQueue } from './Queue.js';
import unzip from '../utils/unzip.js';
import generateHashFromZipFilePath from '../utils/generateHashFromZipFilePath.js';
import BaseLogger from '../@types/BaseLogger.js';

export default (app: { log: BaseLogger, mangaDirTemp: string }) => {
  const queue = unzipChapterToTempDirQueue;
  const logger = app.log.child({ worker: 'UnzipChapters' });
  logger.info('Worker started');

  queue.process(async (job) => {
    const out = path.join(
      app.mangaDirTemp,
      generateHashFromZipFilePath(job.data.filePath),
    );
    app.log.info({ in: job.data.filePath, out }, 'Processing job %s', job.id);
    return unzip(
      job.data.filePath,
      out,
    );
  });
};
