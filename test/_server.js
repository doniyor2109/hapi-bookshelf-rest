const hapi = require('hapi');

const rest = require('../lib/index');

module.exports = (t, bookshelfInstance) => {
	const server = new hapi.Server({
		debug: {
			log: '*',
			request: '*',
		},
	});

	server.connection({
		port: 5153,
		host: '0.0.0.0',
	});

	let register = (server, options, next) => {
		let models = require('./_model')(bookshelfInstance);

		rest(server, {
			path: '/car',
			model: models.Car,
			bookshelf: bookshelfInstance,
		}).generateRoutes();

		rest(server, {
			path: '/user',
			model: models.User,
			bookshelf: bookshelfInstance,
		}).generateRoutes();

		next();
	};

	register.attributes = {
		name: 'rest',
	};

	return server
		.register(register)
		.then(() => {
			return server
				.start()
				.then(() => {
					if (t) {
						t.pass();
					}
				});
		})
		.catch(err => {
			if (t) {
				t.fail();
			}
			console.log(err);
		});
};
