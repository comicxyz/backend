exports.up = function (knex) {
    return knex.schema.hasTable('configs').then(exists => {
        if (!exists) {
            return knex.schema.createTable('configs', (table) => {
                table.increments('id');
                table.string('config_key', 100).index();
                table.text('config_value')
            })
        };
    })
}

exports.down = function (knex) {
    return knex.schema
        .dropTable('configs')
};

exports.config = { transaction: false };