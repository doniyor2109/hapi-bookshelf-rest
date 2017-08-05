exports.seed = function (knex) {
	return knex('user').del()
		.then(function () {
			return knex('user').insert([
				{ name: 'tes1', phone: '123345', height: 5, },
				{ name: 'test2', phone: '54321', height: 10, },
			]);
		});
};
