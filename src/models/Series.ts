import { Model, snakeCaseMappers } from 'objection';

class SeriesModel extends Model {
  id!: number;

  seriesTitle!: string;

  count!: number;

  static get tableName() {
    return 'chapters';
  }

  static get columnNameMappers() {
    return snakeCaseMappers({ upperCase: false });
  }

  static get idColumn() {
    return 'id';
  }
}

export default SeriesModel;
