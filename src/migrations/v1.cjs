exports.up = function (knex) {
  return knex.schema
    .createTableIfNotExists('chapters', (table) => {
      table.increments('id');
      table.string('series_title', 500).index();
      table.string('chapter_title', 255)
      table.integer('volume')
      table.text('comic_info')
      table.string('file_path', 1000)
      table.string('summary')
      table.text('base64_thumbnail')
      table.string('website', 500).index();
      table.timestamps(true, true);
    })
    .createTableIfNotExists('reading_progress', (table) => {
      table.specificType('chapter_id', 'int4').primary();
      table.integer('current_page').index();
      table.string('progress', 3);
      table.timestamp('started_at', { useTz: true }).defaultTo(knex.fn.now());
      table.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now());
    });
};

exports.down = function (knex) {
  return knex.schema
    .dropTable('reading_progress')
    .dropTable('chapters')
};

exports.config = { transaction: false };