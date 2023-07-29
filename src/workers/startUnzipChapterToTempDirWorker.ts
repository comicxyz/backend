import loadConfig from '../config/loadConfig.js';
import UnzipChapterToTempDirWorker from './UnzipChapterToTempDir.worker.js';
import logger from './logger.js';
import { models } from '../models/knex.config.js';

(async () => {
  const config = await loadConfig({
    moduleName: 'startUnzipChapterToTempDirWorker',
    models,
    log: logger,
  });
  UnzipChapterToTempDirWorker({
    log: logger,
    mangaDirTemp: config.MANGA_DIR_TEMP,
  });
})();
