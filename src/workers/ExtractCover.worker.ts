import { pino } from 'pino';
import { Knex } from 'knex';
import { extractCoverQueue } from './Queue.js';
import models from '../models/index.js';
import ScanDirConfig from '../models/ScanDirConfig.js';
import extractFirstImage from '../utils/extractFirstImage.js';

type LoggerType = pino.BaseLogger & {
  child(bindings: pino.Bindings, options?: pino.ChildLoggerOptions): LoggerType
};

export default (modules: {
  log: LoggerType,
  models: typeof models,
  config: ScanDirConfig['configValue']
  knex: Knex,
}) => {
  const logger = modules.log.child({ worker: 'ExtractCover' });
  logger.info('Worker started');

  extractCoverQueue.process(async (job) => {
    const jobLogger = logger.child({ jobId: job.id });
    jobLogger.info({ jobData: job.data }, 'Extracting Cover (ID: %s)', job.id);
    const base64Thumbnail = await extractFirstImage(job.data.file);
    const ChapterModel = modules.models.ChaptersModel.query();
    return ChapterModel.updateAndFetchById(job.data.id, {
      base64Thumbnail,
    });
  })
    .catch((err) => {
      logger.error({ err: err as Error });
      throw err;
    });

  extractCoverQueue.on('completed', async (job) => {
    const jobLogger = logger.child({ jobId: job.id });
    jobLogger.info('Cover updated (ID: %s)', job.id);
  });

  extractCoverQueue.on('failed', async (job, err) => {
    const jobLogger = logger.child({ jobId: job.id });
    jobLogger.error({ err }, 'Failed adding file to database (%s)', job.id);
  });
};
