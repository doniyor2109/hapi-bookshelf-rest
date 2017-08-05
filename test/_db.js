const knex = require('knex');
const bookshelf = require('bookshelf');

let knexConfig = require('./_knexfile');
let knexInstance = require('knex')(knexConfig['development']);
let bookshelfInstance = require('bookshelf')(knexInstance);

bookshelfInstance.plugin([
	'pagination',
]);

module.exports = knexInstance
	.migrate
	.latest()
	.then(() => {
		return knexInstance.seed.run();
	})
	.then(() => bookshelfInstance);
