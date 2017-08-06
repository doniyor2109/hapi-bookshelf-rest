exports.seed = function (knex) {
	return knex('user')
		.del()
		.then(() => knex('car').del())
		.then(() => {
			return knex('car')
				.insert([
					{ id: 1, name: 'car1', model: 'model1'},
					{ id: 2, name: 'car1', model: 'model2'},
				])
				.returning('id');
		}).then((ids) => {
			return knex('user')
				.insert([
					{ id: 1, name: 'user1', phone: 'phone2', height: 5, car_id: 1, },
					{ id: 2, name: 'user2', phone: 'phone2', height: 10, car_id: 2, },
				]);
		});
};
