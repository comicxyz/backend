import { AxiosRequestHeaders } from 'axios';
import slugify from 'slugify';
import { existsSync } from 'fs';
import { rimraf } from 'rimraf';
import { join, resolve } from 'path';
import sanitize from 'sanitize-filename';
import { QUEUE_NAMES, chaptersQueue, zipQueue } from './Queue.js';
import { generateChapterDirPath, makeChapterDirectory } from '../utils/generateChapterDirectory.js';
import createChapterZippedFileFromArrayOfImageUrls from '../utils/createChapterZippedFileFromArrayOfImageUrls.js';
import writeComicInfoXmlFile from '../utils/writeComicInfoXmlFile.js';
import ComicInfoXml from '../@types/ComicInfoXml.js';
import ChapterInterface from '../@types/ChapterInterface.js';
import getAllDownloaders from '../utils/getAllDownloaders.js';
import { GetChapterImagesInterface, GetDownloadImagesRequestHeadersModuleType } from '../@types/DownloaderInterfaces.js';
import BaseLogger from '../@types/BaseLogger.js';
import { AppConfig } from '../@types/AppConfig.js';

export default function DownloadChapters(app: {
  log: BaseLogger,
  config: AppConfig }) {
  const logger = app.log.child({ worker: 'DownloadChapters' });
  logger.info('Worker started');

  getAllDownloaders(app.config.DOWNLOADERS_DIR).then((downloaders) => {
    if (Object.keys(downloaders).length === 0) {
      logger.warn('No downloaders found');
    }

    Object.keys(downloaders).forEach((downloader) => {
      logger.info('Downloader found: %s', downloader);
    });
  }).catch((err) => {
    logger.error(err);
  });

  const { NUM_CHAPTER_WORKERS } = app.config;

  chaptersQueue.process(NUM_CHAPTER_WORKERS, async (job) => {
    const log = logger.child({ jobId: job.id, logJob: QUEUE_NAMES.DOWNLOAD_CHAPTERS });

    const services = await getAllDownloaders(app.config.DOWNLOADERS_DIR);
    const {
      url, title, seriesTitle, comicInfoXml,
    } = job.data;
    const comicUrl = new URL(url);
    const { host } = comicUrl;
    const dirPath = generateChapterDirPath(
      sanitize(slugify(seriesTitle)),
      sanitize(slugify(title)),
      app.config.MANGA_DIR,
    );

    if (existsSync(dirPath)) {
      log.info('Cleaning directory %s', dirPath);

      try {
        await rimraf(dirPath);
      } catch (err) {
        log.error('Unable to remove %s', dirPath);
        log.error(err);
        throw err;
      }
      log.info('Cleaned dir %s', dirPath);
    }

    await makeChapterDirectory(dirPath);
    const serviceDir = services[host];

    const { default: getChapterImages } = await import(`../../${app.config.DOWNLOADERS_DIR}/${serviceDir}/getChapterImages.js`) as { default: GetChapterImagesInterface };
    let getImageDownloadRequestHeaders;
    let headers = {} as AxiosRequestHeaders;
    try {
      const getDownloadImagesRequestHeadersInternal: GetDownloadImagesRequestHeadersModuleType = await import(`../../${app.config.DOWNLOADERS_DIR}/${serviceDir}/getRequestHeaders.js`) as GetDownloadImagesRequestHeadersModuleType;
      log.info('Special headers found');
      getImageDownloadRequestHeaders = getDownloadImagesRequestHeadersInternal.default;
      headers = getImageDownloadRequestHeaders(url);
    } catch (err) {
      log.info('Special headers not found');
    }

    const images = await getChapterImages(url);
    if (images.length === 0) {
      throw new Error('no images found');
    }

    try {
      await createChapterZippedFileFromArrayOfImageUrls(
        images,
        dirPath,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        log,
        { headers },
      );
    } catch (error) {
      log.error(error);
      throw error;
    }

    try {
      // creating ComicInfo.xml file into the folder using fs
      // data from  job.data.comicInfoXml
      if (comicInfoXml) {
        await writeComicInfoXmlFile(join(dirPath, 'ComicInfo.xml'), new ComicInfoXml(comicInfoXml));
        log.info('Created ComicInfo.xml file');
      }
    } catch (error) {
      log.error(error);
    }

    return {
      chapter: job.data,
      targetDirPath: dirPath,
      outputPath: resolve(join(dirPath, '..', `${sanitize(slugify(title))}-${sanitize(slugify(seriesTitle))}.cbz`)),
    };
  }).catch((error) => {
    app.log.error({ err: error as Error });
    throw error;
  });

  chaptersQueue.on('completed', (job, result: { chapter: ChapterInterface, targetDirPath: string, outputPath: string }) => {
    const log = logger.child({ jobId: job.id, logJob: QUEUE_NAMES.DOWNLOAD_CHAPTERS });
    log.info('Chapter downloaded %s %s (%s)', job.data.seriesTitle, job.data.title, job.name);
    zipQueue.getJob(job.id).then((existingJob) => {
      if (existingJob) {
        existingJob.remove()
          .then(() => {
            zipQueue.add(result, { jobId: job.id }).catch((err) => log.error(err));
          })
          .catch((err) => log.error({ err: err as Error }, 'Cannot add zip job'));
      } else {
        zipQueue.add(result, { jobId: job.id }).catch((err) => log.error(err));
      }
    })
      .catch((err) => log.error({ err: err as Error }, 'Cannot add zip job'));
  });
}
