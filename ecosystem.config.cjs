module.exports = {
  apps: [{
    script: 'start.sh',
    name: "server",
    interpreter: "/bin/sh"
  },
  {
    script: 'start.sh',
    name: "AddChapterToDbWorker",
    args: 'dist/workers/startAddChapterToDbWorker.js',
    interpreter: "/bin/sh"
  },
  {
    script: 'start.sh',
    name: "CronScanDirWorker",
    args: 'dist/workers/startCronScanDirWorker.js',
    interpreter: "/bin/sh"
  },
  {
    script: 'start.sh',
    name: "ExtractCoverWorker",
    args: 'dist/workers/startExtractCoverWorker.js',
    interpreter: "/bin/sh"
  },
  {
    script: 'start.sh',
    name: "ZipWorker",
    args: 'dist/workers/startZipDownloadedChaptersWorker.js',
    interpreter: "/bin/sh"
  },
  {
    script: 'start.sh',
    name: "WatchUrlWorker",
    args: 'dist/workers/startWatchUrlWorker.js',
    interpreter: "/bin/sh"
  },
  {
    script: 'start.sh',
    name: "UnzipWorker",
    args: 'dist/workers/startUnzipChapterToTempDirWorker.js',
    interpreter: "/bin/sh"
  },
  {
    script: 'start.sh',
    name: "DownloadWorker",
    args: 'dist/workers/startDownloadChaptersWorker.js',
    interpreter: "/bin/sh"
  },
  ],
};
