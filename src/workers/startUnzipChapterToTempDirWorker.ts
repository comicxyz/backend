import UnzipChapterToTempDirWorker from './UnzipChapterToTempDir.worker.js';
import logger from './logger.js';

(async () => {
  UnzipChapterToTempDirWorker({
    log: logger,
    mangaDirTemp: process.env.MANGA_DIR_TEMP || '/manga/temp',
  });
})();
