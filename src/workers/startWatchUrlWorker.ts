import WatchUrlWorker from './WatchUrl.worker.js';
import logger from './logger.js';
import { models, connection as knex } from '../models/knex.config.js';

(async () => {
  WatchUrlWorker({
    log: logger,
    knex,
    models,
    dir: process.env.DOWNLOADERS_DIR || 'dist/downloaders',
  });
})();
