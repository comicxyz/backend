import Objection, { Model, QueryContext, snakeCaseMappers } from 'objection';
import sanitize from 'sanitize-filename';
import slugify from 'slugify';

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

  letterGroup!: string;

  static get tableName() {
    return 'chapters';
  }

  static get columnNameMappers() {
    return snakeCaseMappers({ upperCase: false });
  }

  static get idColumn() {
    return 'id';
  }

  getLetterGroup() {
    let letter = slugify(sanitize(this.seriesTitle[0])).toUpperCase();
    if ('ABCDEFGHIJKLMNOPQRSTUVWXYZ'.indexOf(letter) === -1 || letter === '') {
      letter = '#';
    }

    this.letterGroup = letter;
  }

  async $beforeInsert(queryContext: QueryContext) {
    await super.$beforeInsert(queryContext);
    this.getLetterGroup();
  }

  async $beforeUpdate(
    opt: Objection.ModelOptions,
    queryContext: QueryContext,
  ) {
    await super.$beforeUpdate(opt, queryContext);
    this.getLetterGroup();
  }
}

export default ChaptersModel;
