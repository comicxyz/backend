import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import recursiveReadDir from 'recursive-readdir';
import path from 'path';
import { addChapterToDbQueue } from '../workers/Queue.js';

export default (fastify: FastifyInstance) => async (
  req:FastifyRequest<{ Querystring: { dir: string } }>,
  res:FastifyReply,
) => {
  const comicDirs = await recursiveReadDir(
    req.query.dir || fastify.config.MANGA_DIR,
  );
  const files = comicDirs
    .filter((file) => ['.cbz', '.zip', '.rar'].includes(path.extname(file)));

  await addChapterToDbQueue
    .addBulk(files.map((filePath) => ({ data: { filePath }, opts: { jobId: filePath } })))
    .catch((err) => {
      fastify.log.error({ err: err as Error }, 'Error add comic chapter to database');
    });

  return res.send({ files });
};
