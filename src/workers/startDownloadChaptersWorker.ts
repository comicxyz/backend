import loadConfig from '../config/loadConfig.js';
import DownloadChapters from './DownloadChapters.worker.js';
import logger from './logger.js';

(async () => {
  const config = await loadConfig({ moduleName: 'startDownloadChaptersWorker', log: logger });
  DownloadChapters({
    log: logger,
    config,
  });
})();
