module.exports = {
  apps: [{
    script: 'start.sh',
    name: "server",
    args: 'dist/server.js'
  },
  {
    script: 'start.sh',
    name: "AddChapterToDbWorker",
    args: 'dist/workers/startAddChapterToDbWorker.js',
  },
  {
    script: 'start.sh',
    name: "CronScanDirWorker",
    args: 'dist/workers/startCronScanDirWorker.js',
  },
  {
    script: 'start.sh',
    name: "ExtractCoverWorker",
    args: 'dist/workers/startExtractCoverWorker.js',
  },
  {
    script: 'start.sh',
    name: "ZipWorker",
    args: 'dist/workers/startZipDownloadedChaptersWorker.js',
  },
  {
    script: 'start.sh',
    name: "WatchUrlWorker",
    args: 'dist/workers/startWatchUrlWorker.js',
  },
  {
    script: 'start.sh',
    name: "UnzipWorker",
    args: 'dist/workers/startUnzipChapterToTempDirWorker.js',
  },
  {
    script: 'start.sh',
    name: "DownloadWorker",
    args: 'dist/workers/startDownloadChaptersWorker.js',
  },
  ],
};
