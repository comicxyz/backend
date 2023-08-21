exports.up = function (knex) {
  const createTableConfigs = knex.schema
    .hasTable('configs').then(exists => {
      if (!exists) {
        return knex.schema.createTable('configs', (table) => {
          table.increments('id');
          table.string('config_key', 100).index();
          table.text('config_value')
        })
      };
      return
    });
  const createTableChapters = knex.schema
    .hasTable('chapters').then(exists => {
      if (!exists) {
        return knex.schema.createTable('chapters', (table) => {
          table.increments('id');
          table.string('series_title', 500).index();
          table.specificType('letter_group', 'char(1)').index();
          table.string('chapter_title', 255);
          table.integer('volume');
          table.text('comic_info');
          table.string('file_path', 1000).unique();
          table.text('summary');
          table.text('base64_thumbnail')
          table.string('website', 500).index();
          table.date('published_at').index();
          table.timestamps(true, true);
        })
      }
      return
    })
  const createTableReadingProgress = knex.schema
    .hasTable('reading_progress').then(exists => {
      if (!exists) {
        return knex.schema.createTable('reading_progress', (table) => {
          table.integer('chapter_id').primary();
          table.integer('current_page').index();
          table.string('progress', 3);
          table.timestamp('started_at', { useTz: true }).defaultTo(knex.fn.now());
          table.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now());
        });
      };
      return;
    })
  return Promise.all([createTableConfigs, createTableChapters, createTableReadingProgress]);
};

exports.down = function (knex) {
  return knex.schema
    .dropTable('reading_progress')
    .dropTable('chapters')
    .dropTable('configs')
};

exports.config = { transaction: false };