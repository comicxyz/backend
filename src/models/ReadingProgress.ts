import { Model, snakeCaseMappers } from 'objection';

class ReadingProgressModel extends Model {
  chapterId!: number;

  currentPage!: number;

  progress!: number;

  startedAt?:Date;

  updatedAt?: Date;

  static get tableName() {
    return 'reading_progress';
  }

  static get columnNameMappers() {
    return snakeCaseMappers({ upperCase: false });
  }

  static get idColumn() {
    return 'chapter_id';
  }
}

export default ReadingProgressModel;
