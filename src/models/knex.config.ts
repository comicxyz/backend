import Knex from 'knex';
import { knexSnakeCaseMappers } from 'objection';
import models from '../models/index.js';
import logger from '../workers/logger.js';

let client = process.env.DB_CLIENT || 'pg';

if (client === 'sqlite3') {
  client = 'better-sqlite3';
}
logger.info({ client }, 'Initializing database...');

const connection = Knex({
  client,
  connection: () => {
    if (client === 'better-sqlite3') {
      return {
        filename: process.env.DB_FILENAME || './db.sqlite',
      };
    }

    return {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
      user: process.env.DB_USER,
      database: process.env.DB_NAME,
      password: process.env.DB_PASSWORD,
    };
  },
  ...knexSnakeCaseMappers({
    upperCase: false,
  }),
});

models.ChaptersModel.knex(connection);
models.ReadingProgressModel.knex(connection);
models.ConfigModel.knex(connection);
models.ScanDirConfigModel.knex(connection);

export { connection, models };
