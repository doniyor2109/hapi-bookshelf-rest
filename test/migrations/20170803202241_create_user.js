
exports.up = function(knex, Promise) {
    return knex.schema.createTable('user', function(table){
        table.increments('id').primary();
        table.string('name');
        table.string('phone').notNullable();
        table.float('height');
        table.time('birth');
    });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable('user');
};
