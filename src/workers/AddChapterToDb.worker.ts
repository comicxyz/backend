import dayjs from 'dayjs';
import { Knex } from 'knex';
import readComicInfoFromZipFile from '../utils/readComicInfoFromZipFile.js';
import { ScanProgressMessagingQueue, addChapterToDbQueue, extractCoverQueue } from './Queue.js';
import ComicInfoXml from '../@types/ComicInfoXml.js';
import parseVolumeFromString from '../utils/parseVolumeFromString.js';
import { ComicInfoXmlInterface } from '../@types/ComicInfoXmlInterface.js';
import { onFinishedAddChapterToDatabase, onFailedAddChapterToDatabase } from './hooks.js';
import models from '../models/index.js';
import ScanDirConfig from '../models/ScanDirConfig.js';
import extractFirstImage from '../utils/extractFirstImage.js';
import BaseLogger from '../@types/BaseLogger.js';

export default (modules: {
  log: BaseLogger,
  models: typeof models,
  config: ScanDirConfig['configValue']
  knex: Knex,
}) => {
  const logger = modules.log.child({ worker: 'AddChaptersToDB' });
  logger.info('Worker started');

  function parseComicInfoFromFilePath(pathfile: string):ComicInfoXmlInterface {
    const paths = pathfile.split('/');

    const seriesTitle = paths[paths.length - 2];
    const chapterTitle = paths[paths.length - 1];
    const { volume } = parseVolumeFromString(chapterTitle);

    return {
      // remove extension
      Title: chapterTitle.replace(/\.[^/.]+$/, ''),
      Series: seriesTitle,
      Volume: volume,
      Summary: '',
    };
  }

  addChapterToDbQueue.process(modules.config.SCAN_DIR_NUM_WORKERS || 4, async (job) => {
    const jobLogger = logger.child({ jobId: job.id });
    jobLogger.info({ jobData: job.data }, 'Processing job (ID: %s)', job.id);
    jobLogger.info('Adding %s to database', job.data.filePath);

    const ChapterModel = modules.models.ChaptersModel.query();

    const exists = await ChapterModel.findOne({ filePath: job.data.filePath });

    async function extractCover(
      file: string,
      id: null | number,
    ): Promise<string | undefined> {
      if (id !== null) {
        await extractCoverQueue.add({ file, id }, { jobId: file });
        return undefined;
      }
      return extractFirstImage(job.data.filePath);
    }

    if (exists && modules.config.SCAN_DIR_SKIP_EXISTING) {
      jobLogger.info('File %s already on database. Skipping...', job.data.filePath);
      return 'skipped';
    }

    let thumbnail: string | null | undefined;
    if (modules.config.SCAN_DIR_EXTRACT_COVER === 'always') {
      try {
        thumbnail = await extractCover(job.data.filePath, null);
      } catch (errExtractImage) {
        jobLogger.error({ err: errExtractImage }, 'Error extracting image from file');
        thumbnail = undefined;
      }
    }

    let publishedAt = new Date();

    const comicInfoStr = await readComicInfoFromZipFile(job.data.filePath) as string;
    let comicInfo: ComicInfoXmlInterface;

    if (comicInfoStr) {
      jobLogger.info('Found ComicInfo.xml');
      comicInfo = ComicInfoXml.fromXml(comicInfoStr);
    } else {
      jobLogger.warn('ComicInfo.xml not found in zip/cbz file');
      comicInfo = parseComicInfoFromFilePath(job.data.filePath);
    }

    if (comicInfo.Year && comicInfo.Month && comicInfo.Day) {
      publishedAt = dayjs()
        .year(comicInfo.Year)
        .month(comicInfo.Month)
        .date(comicInfo.Day)
        .toDate();
    }

    jobLogger.info({ title: comicInfo.Title, series: comicInfo.Series, volume: comicInfo.Volume });

    if (exists) {
      jobLogger.info('File %s already on database. Updating...', job.data.filePath);

      if (modules.config.SCAN_DIR_EXTRACT_COVER === 'noCoverOnly' && !exists.base64Thumbnail) {
        try {
          thumbnail = await extractCover(job.data.filePath, null);
        } catch (errExtractImage) {
          jobLogger.error({ err: errExtractImage }, 'Error extracting image from file');
          thumbnail = undefined;
        }
      }

      if (modules.config.SCAN_DIR_EXTRACT_COVER === 'noCoverOnly-deferred' && !exists.base64Thumbnail) {
        try {
          thumbnail = await extractCover(job.data.filePath, exists.id);
        } catch (errExtractImage) {
          jobLogger.error({ err: errExtractImage }, 'Error extracting image from file');
          thumbnail = undefined;
        }
      }

      if (modules.config.SCAN_DIR_EXTRACT_COVER === 'always-deferred') {
        thumbnail = await extractCover(job.data.filePath, exists.id);
      }

      await exists.$query()
        .update({
          chapterTitle: comicInfo.Title,
          seriesTitle: comicInfo.Series,
          comicInfo: JSON.stringify(comicInfo),
          summary: comicInfo.Summary,
          volume: comicInfo.Volume,
          base64Thumbnail: thumbnail,
          website: comicInfo.Web,
          updatedAt: new Date(),
          publishedAt,
        });
      return 'updated';
    }

    if (modules.config.SCAN_DIR_EXTRACT_COVER === 'newOnly') {
      try {
        thumbnail = await extractCover(job.data.filePath, null);
      } catch (errExtractImage) {
        jobLogger.error({ err: errExtractImage }, 'Error extracting image from file');
        thumbnail = undefined;
      }
    }

    const newRow = await modules.models.ChaptersModel.query().insertAndFetch({
      chapterTitle: comicInfo.Title,
      seriesTitle: comicInfo.Series,
      filePath: job.data.filePath,
      comicInfo: JSON.stringify(comicInfo),
      summary: comicInfo.Summary,
      volume: comicInfo.Volume,
      base64Thumbnail: thumbnail,
      website: comicInfo.Web,
      createdAt: new Date(),
      updatedAt: new Date(),
      publishedAt,
    });

    if (modules.config.SCAN_DIR_EXTRACT_COVER === 'newOnly-deferred' || modules.config.SCAN_DIR_EXTRACT_COVER === 'always-deferred') {
      thumbnail = await extractCover(job.data.filePath, newRow.id);
    }

    return 'new';
  })
    .catch((err) => {
      logger.error({ err: err as Error });
      throw err;
    });

  addChapterToDbQueue.on('completed', async (job) => {
    const jobLogger = logger.child({ jobId: job.id });

    // Report to cronScanDirQueue that this job is completed
    if (job.data.progressQueue) {
      const queue = ScanProgressMessagingQueue(job.data.progressQueue);
      await queue.add({
        file: job.data.filePath,
        status: job.returnvalue,
      });
    }

    jobLogger.info('File added to database (%s). Status: %s', job.id, job.returnvalue);
    try {
      await onFinishedAddChapterToDatabase(job);
    } catch (errHook) {
      jobLogger.error({ err: errHook }, 'Failed hook onChapterAddedToDatabase');
    }
  });

  addChapterToDbQueue.on('failed', async (job, err) => {
    const jobLogger = logger.child({ jobId: job.id });
    jobLogger.error({ err }, 'Failed adding file to database (%s)', job.id);

    if (job.data.progressQueue) {
      const queue = ScanProgressMessagingQueue(job.data.progressQueue);
      await queue.add({
        file: job.data.filePath,
        status: 'failed',
        errMessage: err.message,
      });
    }

    try {
      await onFailedAddChapterToDatabase(job, err);
    } catch (errHook) {
      jobLogger.error({ err: errHook }, 'Failed hook onFailedAddChapterToDatabase');
    }
  });
};
