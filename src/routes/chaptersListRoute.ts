import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import ChaptersModel from '../models/Chapters.js';
import getWatchedUrlsAsArray from '../utils/getWatchedUrls.js';

export default (app: FastifyInstance) => async (req: FastifyRequest<{
  Querystring: {
    page: number,
    limit: number,
    withCover: boolean,
    withSummary: boolean,
    withComicInfo: boolean,
  } }>, res: FastifyReply) => {
  const page = req.query.page || 1;
  const limit = req.query.limit || 10;

  const repeatableJobs = await getWatchedUrlsAsArray();
  req.log.info({ repeatableJobs }, 'Watched URL(s)');

  const { results: series, total } = await app.objection.models.ChaptersModel
    .query()
    .distinct('seriesTitle')
    .orderBy('seriesTitle', 'asc')
    .page(page - 1, limit);

  res.send({
    results: await Promise.all(series.map(async (s) => {
      const title = s.seriesTitle;
      const columns = ['chapters.id',
        'chapters.seriesTitle',
        'chapters.chapterTitle',
        'chapters.volume',
        'chapters.filePath',
        'chapters.website',
        'chapters.createdAt',
        'chapters.updatedAt',
        'reading_progress.current_page as currentPage',
        'reading_progress.progress as progress',
        'reading_progress.started_at as startedAt',
        'reading_progress.updated_at as lastReadAt'];

      if (req.query.withComicInfo) {
        columns.push('chapters.comicInfo');
      }

      if (req.query.withSummary) {
        columns.push('chapters.summary');
      }

      if (req.query.withCover) {
        columns.push('chapters.base64_thumbnail as base64Thumbnail');
      }

      const chapters = await app.objection.models.ChaptersModel
        .query()
        .leftJoin('reading_progress', 'chapters.id', 'reading_progress.chapterId')
        .select(...columns)
        .where('seriesTitle', title)
        .orderBy('volume', 'desc');

      // find last read chapter: first sort by lastReadAt, then by volume
      const sortedChapter = [...chapters] as unknown as (ChaptersModel & {
        lastReadAt: Date | null })[];

      let lastReadChapter: (ChaptersModel & {
        lastReadAt: Date | null }) | null = sortedChapter.sort((a, b) => {
        if (a.lastReadAt && b.lastReadAt) {
          return b.lastReadAt.getTime() - a.lastReadAt.getTime();
        }
        if (a.lastReadAt) {
          return -1;
        }
        if (b.lastReadAt) {
          return 1;
        }
        return b.volume - a.volume || a.chapterTitle.localeCompare(b.chapterTitle);
      })[0];

      lastReadChapter = lastReadChapter.lastReadAt ? lastReadChapter : null;

      let nextChapterToRead: ChaptersModel | null = chapters[chapters.length - 1];

      if (lastReadChapter) {
        const lastReadChapterId = lastReadChapter.id;
        const lastReadChapterIndex = chapters.findIndex((c) => c.id === lastReadChapterId);
        // find next volume to read
        nextChapterToRead = lastReadChapterIndex > 0
          ? chapters[lastReadChapterIndex - 1] : null;
      }

      // check if it is watched

      return {
        title,
        chapters,
        lastReadChapter,
        nextChapterToRead,
        isWatched: chapters[0].website ? repeatableJobs.includes(chapters[0].website) : false,
      };
    })),
    total,
    page: Number(page),
    limit: Number(limit),
  });
};
