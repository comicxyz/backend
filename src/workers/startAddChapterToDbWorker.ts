import AddChapterToDbWorker from './AddChapterToDb.worker.js';
import logger from './logger.js';
import { models, connection as knex } from '../models/knex.config.js';

(async () => {
  const scanDirConfig = await models.ScanDirConfigModel.getConfig();
  logger.info({ scanDirConfig }, 'scanDirConfig');
  AddChapterToDbWorker({
    log: logger,
    models,
    knex,
    config: scanDirConfig,
  });
})();
