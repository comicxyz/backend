import { FtpConnection } from 'ftp-srv';
import fsAsync from 'fs/promises';
import { FastifyInstance } from 'fastify';
import _ from 'lodash';
import nodePath from 'path';
import slugify from 'slugify';
import { createReadStream } from 'fs';
import dayjs from 'dayjs';

enum DirLevel {
  ROOT,
  CATEGORIES,
  SERIES,
  CHAPTER,
}

// const UNIX_SEP_REGEX = /\//g;
const WIN_SEP_REGEX = /\\/g;

export default class ComicFileSystem {
  root = '/';

  cwd = '/';

  db: FastifyInstance['objection'];

  log: FastifyInstance['log'];

  connection: FtpConnection;

  constructor(connection: FtpConnection, root: string, cwd: string, app: FastifyInstance) {
    this.connection = connection;
    this.root = root;
    this.cwd = cwd;
    this.db = app.objection;
    this.log = app.log;
  }

  currentDirectory(): string {
    this.log.info('Called currentDirectory');
    return this.cwd;
  }

  resolvePath(path: string) {
    this.log.info({ path }, 'Called _resolvePath');
    const resolvedPath = path.replace(WIN_SEP_REGEX, '/');

    // Join cwd with new path
    const joinedPath = nodePath.isAbsolute(resolvedPath)
      ? nodePath.normalize(resolvedPath)
      : nodePath.join('/', this.cwd, resolvedPath);

    // Create FTP client path using unix separator
    const clientPath = joinedPath.replace(WIN_SEP_REGEX, '/');
    this.log.info({ path, cwd: this.cwd }, 'Called chdir');

    const urlParts = clientPath.split('/').filter((p) => !!p);
    const category = urlParts[0];
    let [, seriesId, chapterId] = urlParts;

    if (seriesId) {
      const trySeriesId = /\[(\d+)]$/g.exec(seriesId)?.[1];
      if (trySeriesId) {
        seriesId = trySeriesId;
      } else {
        throw new Error(`Invalid series id: ${seriesId}`);
      }
    }

    if (chapterId) {
      const tryChapterID = /\[(\d+)\]\..+$/g.exec(chapterId)?.[1];
      if (tryChapterID) {
        chapterId = tryChapterID;
      } else {
        throw new Error(`Invalid chapter id: ${chapterId}`);
      }
    }

    let currentLevel = DirLevel.ROOT;

    if (chapterId) {
      currentLevel = DirLevel.CHAPTER;
    } else if (seriesId) {
      currentLevel = DirLevel.SERIES;
    } else if (category) {
      currentLevel = DirLevel.CATEGORIES;
    }

    this.log.info({
      resolvedPath,
      currentLevel,
      category,
      seriesId,
      chapterId,
    }, 'Resolved path');

    return {
      path: clientPath, currentLevel, category, seriesId, chapterId,
    };
  }

  async get(fileName: string): Promise<any> {
    this.log.info({ fileName, cwd: this.cwd }, 'Called get');
    const { currentLevel } = this.resolvePath(fileName);
    const stat = {
      name: fileName,
      dev: 16777223,
      mode: 16877,
      nlink: 26,
      uid: 501,
      gid: 20,
      rdev: 0,
      blksize: 4096,
      ino: 2442689,
      size: 832,
      blocks: 0,
      isDirectory: () => currentLevel !== DirLevel.CHAPTER,
      atimeMs: new Date().getTime(),
      mtimeMs: new Date().getTime(),
      ctimeMs: new Date().getTime(),
      birthtimeMs: new Date().getTime(),
      atime: new Date(),
      mtime: new Date(),
      ctime: new Date(),
      birthtime: new Date(),
    };
    return stat;
  }

  async list(path: string) {
    this.log.info({ connection: this.connection.ip, path, cwd: this.cwd }, 'Called list');

    const {
      currentLevel, category, seriesId,
    } = this.resolvePath(path);

    if (currentLevel === DirLevel.ROOT) {
      return Promise.all(['unread', 'read', 'all'].map((name) => ({
        name,
        dev: 16777223,
        mode: 16877,
        nlink: 26,
        uid: 501,
        gid: 20,
        rdev: 0,
        blksize: 4096,
        ino: 2442689,
        size: 832,

        blocks: 0,
        isDirectory: () => true,
        atimeMs: new Date().getTime(),
        mtimeMs: new Date().getTime(),
        ctimeMs: new Date().getTime(),
        birthtimeMs: new Date().getTime(),
        atime: new Date(),
        mtime: new Date(),
        ctime: new Date(),
        birthtime: new Date(),
      })));
    }

    if (currentLevel === DirLevel.CATEGORIES) {
      this.log.info('Getting series for category %s', category);
      const directories = await this.db.models.ChaptersModel.query()
        .select(
          'seriesTitle',
          this.db.knex.raw('min(id) as id'),
          this.db.knex.raw('max(published_at) as published_at'),
        )
        .groupBy('seriesTitle')
        .orderBy('seriesTitle', 'asc');

      return Promise.all(directories.map(async (file) => {
        const publishedAt = dayjs(file.publishedAt, 'YYYY-MM-DD');
        try {
          const stat = {
            name: `${slugify(file.seriesTitle)} [${file.id}]`,
            dev: 16777223,
            mode: 16877,
            nlink: 26,
            uid: 501,
            gid: 20,
            rdev: 0,
            blksize: 4096,
            ino: 2442689,
            size: 832,
            blocks: 0,
            isDirectory: () => true,
            atimeMs: publishedAt.toDate().getTime(),
            mtimeMs: publishedAt.toDate().getTime(),
            ctimeMs: publishedAt.toDate().getTime(),
            birthtimeMs: publishedAt.toDate().getTime(),
            atime: publishedAt.format('YYYY-MM-DD'),
            mtime: publishedAt.format('YYYY-MM-DD'),
            ctime: publishedAt.format('YYYY-MM-DD'),
            birthtime: publishedAt.format('YYYY-MM-DD'),
          };
          return stat;
        } catch (e) {
          this.log.error({ err: e, path, file });
          return null;
        }
      }));
    }

    this.log.info('Getting series for category %s %s', category, seriesId);

    const columns = ['chapters.id',
      'chapters.seriesTitle',
      'chapters.chapterTitle',
      'chapters.volume',
      'chapters.filePath',
      'chapters.website',
      'chapters.createdAt',
      'chapters.updatedAt',
      'chapters.publishedAt',
      'reading_progress.current_page as currentPage',
      'reading_progress.progress as progress',
      'reading_progress.started_at as startedAt',
      'reading_progress.updated_at as lastReadAt'];

    const files = await this.db.models.ChaptersModel
      .query()
      .leftJoin('reading_progress', 'chapters.id', 'reading_progress.chapterId')
      .select(...columns)
      .where('seriesTitle', '=', this.db.models.ChaptersModel.query().where('id', seriesId).select('seriesTitle'))
      .andWhere((qb) => {
        if (category === 'unread') {
          qb.whereNull('reading_progress.progress');
        } else if (category === 'read') {
          qb.whereNotNull('reading_progress.progress');
        }
      })
      .orderBy('volume', 'desc');

    this.log.info({ title: seriesId, files }, 'Files');

    return Promise.all(files.map(async (file) => {
      const publishedAt = dayjs(file.publishedAt, 'YYYY-MM-DD');

      const stat = await fsAsync.stat(file.filePath);
      try {
        _.set(
          stat,
          'name',
          `${slugify(file.chapterTitle)}[${file.id}]${nodePath.extname(file.filePath)}`,
        );
        _.set(
          stat,
          'mtime',
          publishedAt.format('YYYY-MM-DD'),
        );
        return _.set(
          stat,
          'mtimeMs',
          publishedAt.toDate().getTime(),
        );
      } catch (e) {
        this.log.error({ err: e, path, file });
        return null;
      }
    }));
  }

  async chdir(path?: string | undefined): Promise<string> {
    this.log.info({ path, cwd: this.cwd, ip: this.connection.ip }, 'Called chdir');
    const { path: clientPath } = this.resolvePath(path || '');
    this.cwd = clientPath;
    return clientPath;
  }

  mkdir(path: string): Promise<any> {
    this.log.info({ path, cwd: this.cwd }, 'Called mkdir');
    throw new Error('Cannot create directory');
  }

  write(fileName: string, { append, start }:
  { append?: boolean | undefined; start?: any; }) {
    this.log.info("Called write for '%s' with append '%s' and start '%s'", fileName, append, start);
    throw new Error('Cannot write file');
  }

  async read(fileName: string, { start = undefined }: { start?: any; }): Promise<any> {
    const { path, chapterId } = this.resolvePath(fileName);
    this.log.info("Called read for '%s' with start '%s'", fileName, start);

    const chapter = await this.db.models.ChaptersModel.query().findById(chapterId);

    if (!chapter) {
      this.log.info({ chapterId, chapter }, 'Chapter not found');
      throw new Error('Chapter not found');
    }

    const stream = createReadStream(chapter?.filePath, { flags: 'r', start });
    return {
      stream,
      clientPath: path,
    };
  }

  async delete(fileName: string): Promise<any> {
    const { category, chapterId } = this.resolvePath(fileName);

    if (!chapterId) {
      throw new Error('Cannot delete directory');
    }

    if (category === 'unread') {
      // set unread to read
      this.log.info('Marking %s as read', fileName);
      return this.db.models.ReadingProgressModel.query()
        .insert({
          chapterId: Number(chapterId),
          progress: 100,
          currentPage: 1,
          updatedAt: new Date(),
        })
        .onConflict(['chapter_id'])
        .merge();
    }

    if (category === 'read') {
      // set read to unread
      this.log.info('Marking %s as unread', fileName);
      return this.db.models.ReadingProgressModel.query()
        .delete()
        .where('chapterId', chapterId);
    }
    throw new Error('Delete only file from unread/read directory.');
  }

  rename(from: string, to: string): Promise<any> {
    this.log.info("Called rename from '%s' to '%s'", from, to);
    throw new Error('Cannot rename file');
  }

  chmod(fileName: string, mode: any): Promise<any> {
    this.log.info("Called chmod for '%s' with mode '%s'", fileName, mode);
    throw new Error('Cannot change file mode');
  }

  getUniqueName(fileName: string): string {
    this.log.info("Called getUniqueName for '%s'", fileName);
    throw new Error('Method not implemented.');
  }
}
