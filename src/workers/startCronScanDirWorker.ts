import logger from './logger.js';
import { models, connection as knex } from '../models/knex.config.js';
import CronScanDirWorker from './CronScanDir.worker.js';

(async () => {
  CronScanDirWorker({
    log: logger,
    models,
    knex,
  });
})();
