exports.seed = function (knex) {
	return knex('user').del()
		.then(function () {
			return knex('car')
				.insert([
					{ name: 'car1', model: 'model1'},
					{ name: 'car1', model: 'model2'},
				])
				.returning('id');
		}).then(function (ids) {
			return knex('user')
				.del()
				.then(function () {
					return knex('user')
						.insert([
							{ id: 1, name: 'user1', phone: 'phone2', height: 5, car_id: ids[0] - 1, },
							{ id: 2, name: 'user2', phone: 'phone2', height: 10, car_id: ids[0], },
						]);
				});
		});
};
