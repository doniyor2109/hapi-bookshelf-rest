
exports.up = function(knex, Promise) {
    return knex.schema.createTable('car', function(table){
        table.increments('id').primary();
        table.string('name');
        table.string('model');
    });
};

exports.down = function(knex, Promise) {
    return knex.schema.dropTable('car');
};
