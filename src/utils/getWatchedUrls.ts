import { watchUrlQueue } from '../workers/Queue.js';

async function getWatchedUrlsAsArray() {
  const repeatableJobs = await watchUrlQueue.getRepeatableJobs();

  return repeatableJobs
    .map((j) => j.key.split(':::')[0].replace('__default__:', ''));
}

export default getWatchedUrlsAsArray;
