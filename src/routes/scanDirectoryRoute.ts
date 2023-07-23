import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { cronScanDirQueue } from '../workers/Queue.js';

export default (fastify: FastifyInstance) => async (
  req:FastifyRequest<{ Body: {
    scanNow: boolean,
    cron: string,
    dir: string, ext: string[], extractCover: 'always' | 'noCoverOnly' | 'never', skipExisting: boolean } }>,
  res:FastifyReply,
) => {
  let jobSettings;

  if (!req.body.scanNow) {
    jobSettings = {
      jobId: req.body.dir,
      repeat: {
        cron: req.body.cron,
      },
    };
  }
  const job = await cronScanDirQueue.add(
    {
      config: {
        MANGA_DIR: req.body.dir,
        SCAN_DIR_EXT: req.body.ext,
        SCAN_DIR_EXTRACT_COVER: req.body.extractCover,
        SCAN_DIR_SKIP_EXISTING: req.body.skipExisting,
      },
    },
    jobSettings,
  );

  return res.send({ jobId: job.id });
};
