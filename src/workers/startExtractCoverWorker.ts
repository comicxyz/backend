import logger from './logger.js';
import { models, connection as knex } from '../models/knex.config.js';
import ScanDirConfig from '../models/ScanDirConfig.js';
import ExtractCoverWorker from './ExtractCover.worker.js';

(async () => {
  const scanDirConfig = await ScanDirConfig.getConfig();
  logger.info({ scanDirConfig }, 'scanDirConfig');
  ExtractCoverWorker({
    log: logger,
    models,
    knex,
    config: scanDirConfig,
  });
})();
