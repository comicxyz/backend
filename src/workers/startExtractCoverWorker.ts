import logger from './logger.js';
import { models, connection as knex } from '../models/knex.config.js';
import ExtractCoverWorker from './ExtractCover.worker.js';
import loadConfig from '../config/loadConfig.js';

(async () => {
  const config = await loadConfig({
    moduleName: 'startAddChapterToDbWorker',
    models,
    log: logger,
  });
  ExtractCoverWorker({
    log: logger,
    models,
    knex,
    config,
  });
})();
