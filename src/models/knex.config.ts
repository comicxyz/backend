import Knex from 'knex';
import { knexSnakeCaseMappers } from 'objection';
import models from '../models/index.js';

const connection = Knex({
  client: 'pg',
  connection: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
    user: process.env.DB_USER,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
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
