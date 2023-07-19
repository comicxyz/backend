import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

import recursiveReadDir from 'recursive-readdir';
import path from 'path';
import { unzipChapterToTempDirQueue } from '../workers/Queue.js';
import ClientError from '../plugins/ClientError.js';
import generateHashFromZipFilePath from '../utils/generateHashFromZipFilePath.js';
import ChaptersModel from '../models/Chapters.js';

export default (app: FastifyInstance) => async (req: FastifyRequest<{
  Params: {
    chapterId: number,
  },
  Querystring: {
    retry: boolean,
  } }>, res: FastifyReply) => {
  const chapter = await app.objection.models.ChaptersModel.query()
    .leftJoin('reading_progress', 'chapters.id', 'reading_progress.chapterId')
    .select(
      'chapters.*',
      'reading_progress.current_page as currentPage',
      'reading_progress.progress as progress',
      'reading_progress.started_at as startedAt',
      'reading_progress.updated_at as lastReadAt',
    )
    .findById(req.params.chapterId);

  if (chapter) {
    const jobExists = await unzipChapterToTempDirQueue.getJob(chapter.id);
    if (jobExists) {
      req.log.debug('Job exists %s', chapter.id);
      const status = await jobExists.getState();

      if (status === 'failed') {
        if (req.query.retry) {
          await jobExists.retry();
          return res.send({
            chapter,
          });
        }
        throw new ClientError({ code: 'ERR_PREP_CHAPTER', message: `Failed to unzip chapter: ${jobExists.failedReason}` });
      }
      let files: string[] = [];
      let nextChapterToRead: ChaptersModel | null = null;
      const hash = generateHashFromZipFilePath(chapter.filePath);
      if (status === 'completed') {
        const allChapters = (await app.objection.models.ChaptersModel
          .query()
          .leftJoin('reading_progress', 'chapters.id', 'reading_progress.chapterId')
          .select(
            'chapters.*',
            'reading_progress.current_page as currentPage',
            'reading_progress.progress as progress',
            'reading_progress.started_at as startedAt',
            'reading_progress.updated_at as lastReadAt',
          )
          .where('seriesTitle', chapter?.seriesTitle)
          .orderBy('volume', 'desc'));

        const lastReadChapterId = chapter.id;
        const lastReadChapterIndex = allChapters.findIndex((c) => c.id === lastReadChapterId);
        // find next volume to read
        nextChapterToRead = lastReadChapterIndex > 0
          ? allChapters[lastReadChapterIndex - 1] : null;

        files = (await recursiveReadDir(path.join(
          app.config.MANGA_DIR_TEMP,
          hash,
        ))).map((file) => file.replace(app.config.MANGA_DIR_TEMP, '')
          .replace(/^\//, '')).sort((a, b) => a.localeCompare(b));

        res.setApi({
          code: 'CHAPTER_IS_READY',
          message: 'Chapter is ready for reading.',
        });
      } else {
        res.setApi({
          code: 'CHAPTER_QUEUED',
          message: 'Chapter is queued for processing.',
        });
      }

      return res.send({
        chapter,
        status,
        hash,
        files: files.filter((file) => !file.match(/\.xml$/)),
        nextChapterToRead,
      });
    }

    unzipChapterToTempDirQueue.add({
      filePath: chapter.filePath,
    }, { jobId: chapter.id });

    return res.send({
      chapter,
    });
  }

  return res.callNotFound();
};
