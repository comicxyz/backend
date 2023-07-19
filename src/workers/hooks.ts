import Bull from 'bull';
import logger from './logger.js';

const log = logger.child({ module: 'hooks' });

async function onStartedDownloadChapter(job: Bull.Job) {
  log.info({ data: job.data }, 'Download chapter started');
}

async function onFinishedDownloadChapter(job: Bull.Job) {
  log.info({ data: job.data }, 'Download chapter finished');
}

async function onFailedDownloadChapter(err: Error, job: Bull.Job) {
  log.error({ err }, 'Download chapter failed');
}

async function onStartedZipChapter(job: Bull.Job) {
  log.info({ data: job.data }, 'Zip chapter started');
}

async function onFinishedZipChapter(job: Bull.Job) {
  log.info({ data: job.data }, 'Zip chapter finished');
}

async function onFailedZipChapter(err: Error, job: Bull.Job) {
  log.error({ err }, 'Zip chapter failed');
}

async function onStartedScanDirectory(job: Bull.Job) {
  log.info({ data: job.data }, 'Scan directory started');
}

async function onFinishedScanDirectory(job: Bull.Job) {
  log.info({ data: job.data }, 'Scan directory finished');
}

async function onFailedScanDirectory(job: Bull.Job, err: Error) {
  log.error({ err, data: job.data }, 'Scan directory failed');
}

async function onFinishedAddChapterToDatabase(job: Bull.Job) {
  log.info({ data: job.data }, 'Chapter added to database');
}

async function onFailedAddChapterToDatabase(job: Bull.Job, err: Error) {
  log.error({ err, data: job.data }, 'Failed add chapter to database');
}

export {
  onStartedDownloadChapter,
  onFinishedDownloadChapter,
  onFailedDownloadChapter,
  onStartedZipChapter,
  onFinishedZipChapter,
  onFailedZipChapter,
  onStartedScanDirectory,
  onFinishedScanDirectory,
  onFailedScanDirectory,
  onFinishedAddChapterToDatabase,
  onFailedAddChapterToDatabase,
};
