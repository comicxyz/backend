import envSchema from 'env-schema';
import { FastifyInstance } from 'fastify';
import configSchema from './configSchema.js';
import { AppConfig } from '../@types/AppConfig.js';
import BaseLogger from '../@types/BaseLogger.js';
// import { models } from '../models/knex.config.js';

async function loadConfig(args: { moduleName: string, log: BaseLogger, models?: FastifyInstance['objection']['models'] }) {
  const config = envSchema({
    schema: configSchema,
  }) as AppConfig;

  const models = args.models || (await import('../models/knex.config.js')).models;

  const scanDirConfig = await models.ScanDirConfigModel.getConfig();

  args.log.info({ scanDirConfig }, 'scanDirConfig');
  args.log.info({ config }, `Config loaded by ${args.moduleName}`);

  const mergedConfig = { ...scanDirConfig, ...config };

  args.log.info({ mergedConfig }, 'Merged config');
  return mergedConfig;
}

export default loadConfig;
