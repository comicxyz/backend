import logger from './logger.js';
import { models, connection as knex } from '../models/knex.config.js';
import { cronScanDirQueue } from './Queue.js';
import CronScanDirWorker from './CronScanDir.worker.js';
import loadConfig from '../config/loadConfig.js';

(async () => {
  const scanDirConfig = await loadConfig({ moduleName: 'CronScanDirWorker', log: logger });
  const existingCron = await cronScanDirQueue.getRepeatableJobs();
  const exists = existingCron.find((job) => job.key.includes(scanDirConfig.SCAN_DIR_CRON));

  if (existingCron.length > 0) {
    existingCron.forEach(async (job) => {
      if (job.key.includes(scanDirConfig.SCAN_DIR_CRON)) {
        return;
      }

      logger.info('Removing cron job %s', job.key);
      await cronScanDirQueue.removeRepeatableByKey(job.key);
    });
  }

  if (!exists) {
    logger.info('Adding new cron job %s', scanDirConfig.SCAN_DIR_CRON);
    await cronScanDirQueue.add({ config: scanDirConfig }, {
      jobId: 'cron-scan-dir',
      repeat: {
        cron: scanDirConfig.SCAN_DIR_CRON,
      },
    });
  } else {
    logger.info('Cron job %s already exists', scanDirConfig.SCAN_DIR_CRON);
    const job = await cronScanDirQueue.getJob('cron-scan-dir');
    if (job) {
      await job.update({ config: scanDirConfig });
      logger.info('Cron job %s updated', scanDirConfig.SCAN_DIR_CRON);
    }
  }

  CronScanDirWorker({
    log: logger,
    models,
    knex,
    config: scanDirConfig,
  });
})();
