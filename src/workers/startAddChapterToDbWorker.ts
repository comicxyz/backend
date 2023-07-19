import AddChapterToDbWorker from './AddChapterToDb.worker.js';
import logger from './logger.js';
import { models, connection as knex } from '../models/knex.config.js';
import loadConfig from '../config/loadConfig.js';

(async () => {
  const config = await loadConfig({
    moduleName: 'startAddChapterToDbWorker',
    models,
    log: logger,
  });
  AddChapterToDbWorker({
    log: logger,
    models,
    knex,
    config,
  });
})();
