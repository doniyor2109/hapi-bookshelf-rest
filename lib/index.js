const boom = require('boom');
const joi = require('joi');
const Promise = require('bluebird');

function Route(options, routeConfig) {
	let internal = options;

	for (let key in internal) {
		let method = internal[key];

		if (typeof method == 'function') {
			method.bind(internal);
		}
	}

	internal.getQuery = function () {
		let { query } = internal.request;

		if (internal.filterQuery && typeof internal.filterQuery == 'function') {
			let filtered;

			if (query.length) {
				return query.map(function (item) {
					return internal.filterPayload.call(internal, item, internal.request);
				});
			}

			filtered = internal.filterQuery.call(internal, query, internal.request);

			return Object.assign(query, filtered);
		}

		return query;
	};

	internal.getPayload = function () {
		let { payload } = internal.request;

		if (internal.filterPayload && typeof internal.filterPayload == 'function') {
			let filtered;

			if (payload.length) {
				return payload.map(function (item) {
					return Object.assign(
						item,
						internal.filterPayload.call(internal, item, internal.request)
					);
				});
			}

			filtered = internal.filterPayload.call(internal, payload, internal.request);

			return Object.assign(payload, filtered);
		}

		return payload;
	};

	internal.getConfig = function () {
		let oldHandler = routeConfig.handler;

		routeConfig.handler = function (request, reply) {
			internal.request = request;
			internal.reply = reply;

			return Promise
				.resolve()
				.then(function () {
					//deny section

					if (typeof internal.deny == 'function') {
						return internal.deny.call(internal, request);
					}

					if (typeof internal.deny != 'undefined') {
						return internal.deny;
					}

					return false;
				})
				.then(function (deny) {
					if (deny) {
						return reply(boom.forbidden());
					} else {
						return oldHandler.call(internal, request, reply);
					}
				});
		};

		return routeConfig;
	};

	return internal;
}

module.exports = function (server, options = {}, routeConfig = {}) {
	let plugin = {};
	let defaultRoutes = {
		readId: {
			options: {
				dataProvider: function () {
					let modelInstance = this.model.forge();
					let { params } = this.request;

					let condition = {
						[modelInstance.idAttribute]: params.id,
					};

					return this
						.model
						.where(condition)
						.fetch();
				}
			},
			routeConfig: {
				path: `${options.path}/id/{id}`,
				method: 'GET',
				handler: function (request, reply) {
					let internal = this;
					let { params } = internal.request.params;

					return internal
						.dataProvider()
						.then(function (model) {
							if (! model) {
								return reply().code(internal.noModelStatus || 404);
							}

							return reply(model).code(internal.okStatus || 200);
						});
				},
			}
		},
		readOne: {
			options: {
				dataProvider() {
					let { model } = this;
					let modelInstance = model.forge();
					let data = this.getQuery();
					let { params } = this.request.params;

					let query = filter(modelInstance, validateFunc(modelInstance, data), data);

					query = this.queryBuilder(query);

					return query.fetch({
						withRelated: getRelationFromParam(params),
					});
				}
			},
			routeConfig: {
				path: `${options.path}/one/{params*}`,
				method: 'GET',
			}
		},
		readAll: {
			options: {
				dataProvider() {
					let { model } = this;
					let modelInstance = model.forge();
					let data = this.getQuery();
					let { params } = this.request.params;
					let collection = model.collection();
					let query = filter(collection, validateFunc(modelInstance, data), data);

					query = this.queryBuilder(query);

					let withRelated = getRelationFromParam(params);

					if (this.pagination) {
						return pagination(query, data, withRelated);
					} else {
						return query.fetch({
							withRelated,
						});
					}
				}
			},
			routeConfig: {
				path: `${options.path}/all/{params*}`,
				method: 'GET',
			},
		},
		update: {
			options: {
				dataProvider: function () {
					let data = this.getPayload();
					let modelInstance = this.model.forge();

					data[modelInstance.idAttribute] = parseInt(this.request.params.id);

					return this
						.model
						.forge(data)
						.on('saving', this.onSaving)
						.save({}, {
							method: 'update',
						})
						.then(function (model) {
							model.set(model.idAttribute, model.id);

							return model;
						});
				}
			},
			routeConfig: {
				path: `${options.path}/{id}`,
				method: 'PUT',
			}
		},
		delete: {
			options: {
				dataProvider: function () {
					let modelInstance = this.model.forge();
					let { params } = this.request;
					let data = {
						[modelInstance.idAttribute]: params.id,
					};

					return this
						.model
						.where(data)
						.destroy();
				}
			},
			routeConfig: {
				path: `${options.path}/{id}`,
				method: 'DELETE',
			}

		},
		create: {
			options: {
				okStatus: 201,
				dataProvider: function () {
					let { model } = this;
					let modelInstance = model.forge();
					let { idAttribute } = modelInstance;
					let data = this.getPayload();

					if (data[idAttribute]) {
						delete data[idAttribute];
					}

					return model
						.forge()
						.on('saving', this.onSaving)
						.save(data, {
							method: 'insert',
						})
						.then(function (model) {
							return createRelation(model, data);
						});
				}
			},
			routeConfig: {
				path: options.path,
				method: 'POST',
			},

		},
		batch: {
			options: {
				okStatus: 201,
				dataProvider: function () {
					let { model } = this;
					let data = this.getPayload();

					let modelInstance = model.forge();

					let allAttrs = Object.keys(modelInstance.schema).concat(modelInstance.idAttribute);

					let filteredData = data.map(function (item) {
						return validateFunc(modelInstance, item);
					});

					return this
						.bookshelf
						.knex
						.insert(filteredData)
						.into(modelInstance.tableName)
						.returning(allAttrs)
						.then(function (attrs) {
							let models = [];

							attrs.forEach(function (e) {
								models.push(model.forge(e));
							});

							return Promise
								.map(models, function (model) {
									return createRelation(model, data);
								});
						});
				}
			},
			routeConfig: {
				path: `${options.path}/batch`,
				method: 'POST',
			}
		},
	};

	let defaultOptions = {
		queryBuilder(model) {
			return model;
		},
		onSaving(model) {
			model.attributes = validateFunc(model, model.attributes);
		}
	};

	let defaultRouteConfig = {
		handler: function (request, reply) {
			let internal = this;

			return internal
				.dataProvider()
				.then(function (model) {
					if (! model) {
						return reply().code(internal.noModelStatus || 404);
					}

					return reply(model).code(internal.okStatus || 200);
				});
		}
	};

	let globalConfig = {
		server,
		routes: defaultRoutes,
		routeConfig: Object.assign(defaultRouteConfig, routeConfig),
		options: Object.assign(defaultOptions, options),
	};

	function createRoute(config) {
		server.route(config);
	}

	function filter(model, filteredData, data) {
		model.query(function (qb) {
			for (let attr in filteredData) {
				let data = filteredData[attr];
				let operator = data[0];

				if (operator == '<') {
					qb.andWhere(attr, '<', data.substr(1));
				} else if (operator == '>') {
					qb.andWhere(attr, '>', data.substr(1));
				} else if (operator == '~') {
					qb.andWhere(attr, 'like', data.substr(1));
				} else {
					qb.andWhere(attr, '=', data);
				}
			}
		});

		if (data['order']) {
			let orders = data['order'].split(',');

			orders.forEach(order => {
				let tempOrder = order;

				if (order[0] == '-') {
					order = order.substr(1);
				}

				if (order in filteredData) {
					model.orderBy(tempOrder);
				}
			});
		}

		return model;
	}

	function overrideRoute(routeName, localOptions, localRouteConfig) {
		let { options, routeConfig } = globalConfig.routes[routeName];

		globalConfig.routes[routeName] = {
			routeConfig: Object.assign(routeConfig, localRouteConfig),
			options: Object.assign(options, localOptions),
		};
	}

	function validateFunc(model, attrs) {
		let result;

		result = joi.validate(attrs, model.schema || {}, {
			stripUnknown: true,
		});

		if (result.err) {
			throw result.err;
		}

		return result.value;
	}

	function pagination(model, data, withRelated = []) {
		if (! model.fetchPage) {
			throw 'Enable bookshelf pagination plugin: https://github.com/bookshelf/bookshelf/wiki/Plugin:-Pagination';
		} else {
			return model.fetchPage({
				page: data['offset'] || 1,
				pageSize: data['limit'] || 10,
				withRelated,
			});
		}
	}

	function getRelationFromParam(params) {
		let withRelated = [];

		if (params && params.length) {
			let paramsArray = params.split('/');

			paramsArray.forEach((param) => {
				let len = param.length;

				if (param[0] == '[' && param[len - 1] == ']') {
					withRelated = withRelated.concat(param.substr(1).substr(0, len - 2).split(','));
				} else {
					withRelated.push(param);
				}
			});
		}
		return withRelated;
	}

	function createRelation(model, data) {
		for (let key in data) {
			model.related(key);
		}

		return Promise.each(
			Object.keys(model.relations),
			function (relation) {
				let related = model.relations[relation];
				let { relatedData } = related;
				let { parentId } = relatedData;

				if (relatedData.type != 'belongsTo') {
					throw 'Wrong relation type';
				}

				related.set(relatedData['targetIdAttribute'], parentId);

				return related.save(validateFunc(related, data[relation]));
			}
		).then(function () {
			return model;
		});
	}

	for (let route in globalConfig.routes) {
		plugin[route] = function (localOptions, localRouteConfig) {
			overrideRoute(route, localOptions, localRouteConfig);

			return plugin;
		};
	}

	plugin['generateRoutes'] = function () {
		let { routes } = globalConfig;

		globalConfig.server.ext('onRequest', (request, reply) => {
			let requestPath = request.raw.req.url;
			let targetPath = globalConfig.options.path;
			let indexOf = requestPath.indexOf(targetPath);

			if (request.method === 'get' && indexOf == 0) {
				let params = requestPath.substr(targetPath.length);

				if (params[0] === '/') {
					params = params.substr(1);
				}

				if (parseInt(params) > 0) {
					request.setUrl(`${targetPath}/id/${params}`);
				} else if (params == 'one') {
					request.setUrl(`${targetPath}/${params}`);
				} else {
					request.setUrl(`${targetPath}/all/${params}`);
				}
			}

			return reply.continue();
		});

		for (let routeName in routes) {
			let { options, routeConfig } = routes[routeName];
			let finalOptions = Object.assign({}, globalConfig.options, options);
			let finalRouteConfig = Object.assign({}, globalConfig.routeConfig, routeConfig);

			let route = new Route(finalOptions, finalRouteConfig);

			createRoute(route.getConfig());
		}
	};

	return plugin;
};
