import { ScanDirConfigType } from '../@types/AppConfig.js';
import { ScanDirConfigSchema } from '../config/configSchema.js';
import Config from './Config.js';

const configKey = 'AUTO_SCAN';

class ScanDirConfig extends Config {
  configValue!: ScanDirConfigType;

  configKey = configKey;

  static get tableName() {
    return 'configs';
  }

  static get idColumn() {
    return 'configKey';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['configValue'],
      properties: {
        id: { type: 'integer' },
        configKey: { type: 'string', minLength: 1, maxLength: 100 },
        configValue: {
          type: 'object',
          properties: ScanDirConfigSchema,
        },
      },
    };
  }

  static async getConfig() {
    const row = await ScanDirConfig.query().findById(configKey);

    const query = ScanDirConfig.query();

    if (!row) {
      const value = {
        configKey,
        configValue: {},
      } as ScanDirConfig;
      const savedConfig = await query.insertAndFetch(value);
      return savedConfig.configValue;
    }

    const savedConfig = await query
      .updateAndFetchById(configKey, {
        configValue: row.configValue,
      });
    return savedConfig.configValue;
  }
}

export default ScanDirConfig;
