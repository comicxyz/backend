/* eslint-disable no-console */
import Queue, { QueueOptions } from 'bull';
import { Redis, RedisOptions } from 'ioredis';
import ChapterInterface from '../@types/ChapterInterface';
import { AppConfig } from '../@types/AppConfig';

const { redis }: QueueOptions = {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: 6379,
    username: process.env.REDIS_USER || undefined,
    password: process.env.REDIS_PASS || undefined,
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  },
};

type Required<T, K extends keyof T> = T & { [P in K]-?: T[P] };
type BullRedis = ReturnType<Required<QueueOptions, 'createClient'>['createClient']>;

let client: null | BullRedis = null;
let subscriber: null | BullRedis = null;

const createClient: QueueOptions['createClient'] = (type, redisOpts?) => {
  switch (type) {
    case 'client':
      if (!client) {
        client = new Redis(redis as RedisOptions) as unknown as BullRedis;
      }
      return client;
    case 'subscriber':
      if (!subscriber) {
        subscriber = new Redis(redis as RedisOptions) as unknown as BullRedis;
      }
      return subscriber;
    case 'bclient':
      return new Redis(redis as RedisOptions) as unknown as BullRedis;
    default:
      throw new Error('Unexpected connection type: ', type);
  }
};

const TitleProcessQueue = () => new Queue<{ url: string, category?: string }>('comicxyz:title', {
  createClient,
  defaultJobOptions: {
    removeOnComplete: 100,
    attempts: 2,
  },
});

export const QUEUE_NAMES = {
  DOWNLOAD_CHAPTERS: 'comicxyz:download-chapters',
};

const ChaptersQueue = () => new Queue<ChapterInterface>(QUEUE_NAMES.DOWNLOAD_CHAPTERS, {
  createClient,
  defaultJobOptions: {
    removeOnComplete: 100,
    attempts: 5,
  },
});

const ZipQueue = () => new Queue<{
  chapter: ChapterInterface,
  targetDirPath: string, outputPath: string }>('comicxyz:zip', {
  createClient,
  defaultJobOptions: {
    removeOnComplete: 100,
    attempts: 5,
  },
});

const CronScanDirQueue = () => new Queue<{
  config: Pick<AppConfig, 'MANGA_DIR' | 'SCAN_DIR_EXT' | 'SCAN_DIR_EXTRACT_COVER' | 'SCAN_DIR_SKIP_EXISTING'>,
  progress?: {
    total: number,
    new: number,
    updated: number,
    fail: number,
    skipped: number,
  }
}>('comicxyz:cron-scan-dir', {
  createClient,
  defaultJobOptions: {
    removeOnComplete: 30,
    removeOnFail: 30,
    attempts: 2,
  },
});

const AddChapterToDbQueue = () => new Queue<{
  filePath: string,
  progressQueue?: string,
  skipExisting?: AppConfig['SCAN_DIR_SKIP_EXISTING'],
  extractCover?: AppConfig['SCAN_DIR_EXTRACT_COVER'],
}>('comicxyz:db:add-chapter', {
  createClient,
  defaultJobOptions: {
    // removeOnComplete: {
    //   // lets keep the job for 1 day, so if the same file is added again, it will be ignored
    //   age: 24 * 60 * 60,
    // },
    removeOnComplete: true,
    // we will remove the job, but on event failed we will log the error
    removeOnFail: true,
    attempts: 5,
  },
});

const WatchUrlQueue = () => new Queue<{
  url: string,
}>('comicxyz:watch-url', {
  createClient,
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 100,
    attempts: 2,
  },
});

const UnzipChapterToTempDirQueue = () => new Queue<{
  filePath: string,
}>('comicxyz:read-prep', {
  createClient,
  defaultJobOptions: {
    removeOnComplete: 100,
    attempts: 2,
    removeOnFail: 100,
  },
});

const ScanProgressMessagingQueue = (jobId: string) => {
  const scanProgressMessagingQueueName = `comicxyz:scan-progress-messaging:${jobId}`;
  return new Queue<{
    file: string,
    status: 'new' | 'updated' | 'failed' | 'skipped',
    errMessage?: string }>(
    scanProgressMessagingQueueName,
    {
      createClient,
      defaultJobOptions: {
        removeOnComplete: 0,
      },
    },
  );
};

const ExtractCoverQueue = () => {
  const queueName = 'comicxyz:extract-cover';
  return new Queue<{
    file: string,
  }>(
    queueName,
    {
      createClient,
      defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: true,
      },
    },
  );
};

const titleProcessQueue = TitleProcessQueue();
const chaptersQueue = ChaptersQueue();
const zipQueue = ZipQueue();
const addChapterToDbQueue = AddChapterToDbQueue();
const watchUrlQueue = WatchUrlQueue();
const unzipChapterToTempDirQueue = UnzipChapterToTempDirQueue();
const cronScanDirQueue = CronScanDirQueue();
const extractCoverQueue = ExtractCoverQueue();

export {
  TitleProcessQueue,
  titleProcessQueue,
  ChaptersQueue,
  chaptersQueue,
  ZipQueue,
  zipQueue,
  AddChapterToDbQueue,
  addChapterToDbQueue,
  WatchUrlQueue,
  watchUrlQueue,
  UnzipChapterToTempDirQueue,
  unzipChapterToTempDirQueue,
  CronScanDirQueue,
  cronScanDirQueue,
  redis as redisConfig,
  ScanProgressMessagingQueue,
  extractCoverQueue,
  ExtractCoverQueue,
};
