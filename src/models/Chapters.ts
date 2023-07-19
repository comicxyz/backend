import { Model, snakeCaseMappers } from 'objection';

class ChaptersModel extends Model {
  id!: number;

  seriesTitle!: string;

  chapterTitle!: string;

  filePath!:string;

  volume!: number;

  summary!: string;

  comicInfo!: string;

  base64Thumbnail!: string | null;

  website?: string;

  createdAt!: Date;

  updatedAt!: Date;

  publishedAt?: Date;

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

export default ChaptersModel;
