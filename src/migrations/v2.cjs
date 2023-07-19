exports.up = function (knex) {
    return knex.schema
        .table('chapters', (table) => {
            table.date('published_at').index();
        })
};

exports.down = function (knex) {
    return knex.schema
        .table('chapters', (table) => {
            table.dropColumn('published_at');
        });
};

exports.config = { transaction: false };