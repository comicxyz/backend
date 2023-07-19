import fastify from 'fastify';
import { knexSnakeCaseMappers } from 'objection';
import fastifyStatic from '@fastify/static';
import { mkdir } from 'fs/promises';
import path from 'path';
import Ftpsrv from 'ftp-srv';
import replyWrapperPlugin from './plugins/ReplyWrapper.js';
import ioredisPlugin from './plugins/ioredis.js';
import errorHandler from './plugins/errorHandler.js';
import notFoundHandler from './plugins/notFoundHandler.js';
import objectionjs from './plugins/objectionjs.js';
import Models from './models/index.js';
import RedisCache from './plugins/RedisCache.js';
import registerRoutes from './routes/registerRoutes.js';
import ComicFileSystem from './utils/ComicFileSystem.js';
import ClientError from './plugins/ClientError.js';
import loadConfig from './config/loadConfig.js';

async function start() {
  const app = fastify({ logger: true });

  app.setErrorHandler(errorHandler);
  app.setNotFoundHandler(notFoundHandler);
  await app.register(replyWrapperPlugin);

  await app.register(objectionjs, {
    knexConfig: {
      client: 'pg',
      connection: {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
        user: process.env.DB_USER,
        database: process.env.DB_NAME,
        password: process.env.DB_PASSWORD,
      },
      // searchPath: ['public'],
      ...knexSnakeCaseMappers({
        upperCase: false,
      }),
      debug: true || app.config.DB_DEBUG,
    },
    models: Models,
  });

  const config = await loadConfig({ moduleName: 'APIServer', log: app.log, models: app.objection.models });
  app.decorate('config', config);
  // eslint-disable-next-line no-console
  console.table(app.config);

  app
    .register(fastifyStatic, {
      root: app.config.MANGA_DIR_TEMP,
      prefix: '/chapter-files/', // optional: default '/'
      decorateReply: false,
    });

  try {
    await Promise.all([
      mkdir(app.config.MANGA_DIR, { recursive: true }),
      mkdir(app.config.MANGA_DIR_TEMP, { recursive: true }),
      mkdir(path.join('.', app.config.DOWNLOADERS_DIR), { recursive: true }),
    ]);
  } catch (err) {
    app.log.fatal(err, 'Cannot make directories.');
    process.exit(1);
  }

  try {
    await app.objection.knex.migrate.up({
      directory: './dist/migrations',
      extension: 'cjs',
    });
  } catch (err) {
    app.log.error({ err }, 'Cannot run migrations.');
  }

  await app.register(ioredisPlugin, { confKey: 'redis', redisConfig: app.config });
  await app.register(RedisCache, { redis: app.redis, db: 1, ttl: 5 });

  await app.register(registerRoutes);

  app.ready((errorOnAppReady) => {
    app.log.level = app.config.LOG_LEVEL;
    app.log.info('Ready');

    if (errorOnAppReady) {
      app.log.error(errorOnAppReady);
      process.exit(1);
    }

    app.listen({
      host: app.config.HOST,
      port: app.config.PORT,
    }, (err) => {
      if (err) {
        app.log.error(err);
        process.exit(1);
      }
    });
  });

  if (!app.config.DISABLE_FTP_SERVER) {
    const pasvConfig = app.config.FTP_PASV_URL ? {
      pasv_url: app.config.FTP_PASV_URL,
      pasv_min: app.config.FTP_PASV_PORT_MIN,
      pasv_max: app.config.FTP_PASV_PORT_MAX,
    } : {};

    const ftpServer = new Ftpsrv({
      url: `ftp://${app.config.FTP_HOST}:${app.config.FTP_PORT}`,
      anonymous: false,
      ...pasvConfig,
      greeting: 'comicxyz FTP server',
      log: app.log,
    });

    ftpServer.listen().then(() => {
      app.log.info(`FTP server listening on port ${app.config.FTP_PORT}`);
    });

    ftpServer.on('client-error', ({ connection, context, error }) => {
      app.log.error({ connection, context, error }, 'FTP client error');
    });

    ftpServer.on('login', ({ connection, username, password }, resolve, reject) => {
      const root = app.config.MANGA_DIR;
      const cwd = app.config.FTP_ROOT;
      if (username !== app.config.FTP_USER || password !== app.config.FTP_PASSWORD) {
        return reject(new ClientError({ code: 'ERR401', message: 'Invalid username or password' }));
      }

      return resolve({
        root,
        cwd,
        fs: new ComicFileSystem(connection, root, cwd, app),
      });
    });
  }
}

start();
