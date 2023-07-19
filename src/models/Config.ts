import { Model } from 'objection';

class Config extends Model {
  id!: number;

  configKey!: string;

  static get tableName() {
    return 'configs';
  }

  static get idColumn() {
    return 'configKey';
  }
}

export default Config;
