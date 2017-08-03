exports.seed = function(knex) {
	return knex('user').del()
		.then(function () {
			return knex('user').insert([
				{ name: 'admin', phone: '123345', height: 2, }
			]);
		});
};