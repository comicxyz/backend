import { pino } from 'pino';
import { Knex } from 'knex';
import recursiveReadDir from 'recursive-readdir';
import path from 'path';
import {
  onFailedScanDirectory,
  onFinishedScanDirectory,
  onStartedScanDirectory,
} from './hooks.js';
import models from '../models/index.js';
import { ScanProgressMessagingQueue, addChapterToDbQueue, cronScanDirQueue } from './Queue.js';
import { AppConfig } from '../@types/AppConfig.js';

type LoggerType = pino.BaseLogger & {
  child(bindings: pino.Bindings, options?: pino.ChildLoggerOptions): LoggerType
};

export default (modules: {
  log: LoggerType,
  models: typeof models,
  config: AppConfig
  knex: Knex,
}) => {
  const logger = modules.log.child({ worker: 'CronScanDir' });
  logger.info({ config: modules.config }, 'Config');
  logger.info('Worker started');

  cronScanDirQueue.process(async (job) => {
    const jobLogger = logger.child({ jobId: job.id });
    jobLogger.info({ config: modules.config }, 'Config');
    jobLogger.info({ jobData: job.data }, 'Processing job (ID: %s)', job.id);

    onStartedScanDirectory(job)
      .catch((errHookStartedScandir) => {
        jobLogger.error({ err: errHookStartedScandir as Error }, 'Hook error onStartedScanDirectory');
      });

    const comicDirs = await recursiveReadDir(
      job.data.config.MANGA_DIR,
    );

    const files = comicDirs
      .filter((file) => ['.cbz', '.zip', '.rar'].includes(path.extname(file)));

    jobLogger.info('Found %d files', files.length);
    await addChapterToDbQueue
      .addBulk(files.map((filePath) => ({
        data: {
          filePath,
          progressQueue: job.id.toString(),
        },
        opts: { jobId: filePath },
      })))
      .catch((err) => {
        jobLogger.error({ err: err as Error }, 'Error add comic chapter to database');
      });

    const result = await new Promise((resolve, reject) => {
      const scanProgressMessagingQueue = ScanProgressMessagingQueue(job.id.toString());
      const progress = job.data.progress || {
        total: files.length, new: 0, updated: 0, fail: 0, skipped: 0,
      };
      scanProgressMessagingQueue.process(async (scanProgressMessaging) => {
        if (scanProgressMessaging.data.status === 'new') {
          progress.new += 1;
        } else if (scanProgressMessaging.data.status === 'updated') {
          progress.updated += 1;
        } else if (scanProgressMessaging.data.status === 'failed') {
          progress.fail += 1;
          job.log(`ERROR: Cannot add file. File: ${scanProgressMessaging.data.file}. Error message: ${scanProgressMessaging.data.errMessage || 'null'}`);
        } else if (scanProgressMessaging.data.status === 'skipped') {
          progress.skipped += 1;
        }
        jobLogger.info('Progress: %d new, %d updated, %d failed, %d skipped (Total %d)', progress.new, progress.updated, progress.fail, progress.skipped, progress.total);
      });

      scanProgressMessagingQueue.on('completed', async () => {
        if (progress.total <= progress.new + progress.updated + progress.fail + progress.skipped) {
          jobLogger.info('All files has been processed job (ID: %s)', job.id);
          resolve(progress);
        }
        const { data } = job;
        job.update({ ...data, progress });
      });
    });

    return result;
  })
    .catch((err) => {
      logger.error({ err: err as Error });
      throw err;
    });

  cronScanDirQueue.on('completed', async (job) => {
    const jobLogger = logger.child({ jobId: job.id });

    jobLogger.info('Scan directory completed job (ID: %s)', job.id);
    try {
      await onFinishedScanDirectory(job);
    } catch (errHook) {
      jobLogger.error({ err: errHook }, 'onFinishedScanDirectory');
    }
  });

  cronScanDirQueue.on('failed', async (job, err) => {
    const jobLogger = logger.child({ jobId: job.id });

    jobLogger.error({ err }, 'Failed job (ID: %s)', job.id);
    try {
      await onFailedScanDirectory(job, err);
    } catch (errHook) {
      jobLogger.error({ err: errHook }, 'Failed hook onFailedScandingDirectory');
    }
  });
};
