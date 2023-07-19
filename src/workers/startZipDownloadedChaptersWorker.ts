import logger from './logger.js';
import ZipDownloadedChapters from './ZipDownloadedChapters.worker.js';

(async () => {
  ZipDownloadedChapters({
    log: logger,
  });
})();
