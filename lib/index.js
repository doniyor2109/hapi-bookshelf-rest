const boom = require('boom');
const joi = require('joi');
const Promise = require('bluebird');

function Route(options, routeConfig) {
    let internal = options;

    internal.getQuery = function() {
        let { query } = internal.request;

        if(internal.filterQuery && typeof internal.filterQuery == 'function') {
            let filtered;

            if(query.length) {
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

    internal.getConfig = function() {
        let oldHandler = routeConfig.handler;

        internal.dataProvider = internal.dataProvider.bind(internal);

        routeConfig.handler = function(request, reply) {
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
        readAll: {
            options: {
                dataProvider: function() {
                    let { model } = this;
                    let modelInstance = model.forge();
                    let data = this.getQuery();

                    return filter(modelInstance, data).fetch();
                }
            },
            routeConfig: {
                path: options.path,
                method: 'GET',
                handler: function (request, reply) {
                    return this
                        .dataProvider()
                        .then(function(model) {
                            reply(model);
                        });
                }
            },
        },
        readOne: {
            options: {
                dataProvider: function() {
                    let modelInstance = this.model.forge();
                    let { params } = this.request;
                    let condition = {
                        [modelInstance.idAttribute]: params.id
                    };

                    return this
                        .model
                        .where(condition)
                        .fetch();
                }
            },
            routeConfig: {
                path: `${options.path}/{id}`,
                method: 'GET',
                handler: function (request, reply) {
                    return this
                        .dataProvider()
                        .then(function (model) {
                            if(!model) {
                                return reply(boom.notFound());
                            }

                            return reply(model);
                        });
                }
            }
        },
        update: {
            options: {
                dataProvider: function() {
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
                path:  `${options.path}/{id}`,
                method: 'PUT',
                handler: function (request, reply) {
                    return this
                        .dataProvider()
                        .then(function (model) {
                            reply(model);
                        });
                },
            }
        },
        delete: {
            options: {
                dataProvider: function() {
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
                handler: function (request, reply) {
                    return this
                        .dataProvider()
                        .then(function () {
                            reply.success();
                        });
                }
            }

        },
        create: {
            options: {
                dataProvider: function() {
                    let { model } = this;
                    let modelInstance = model.forge();
                    let { idAttribute } = modelInstance;
                    let data = this.getPayload();

                    if(data[idAttribute]) {
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
                handler: function (request, reply) {
                    return this
                        .dataProvider()
                        .then(function (model) {
                            return reply(model).code(201);
                        });
                }
            },

        },
        batch: {
            options: {
                dataProvider: function() {
                    let{ model } = this;
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
                handler: function (request, reply) {
                    return this
                        .dataProvider()
                        .then(function (model) {
                            return reply(model).code(201);
                        });
                }
            }
        },
    };

    let defaultOptions = {
        onSaving: function (model) {
            model.attributes = validateFunc(model, model.attributes);
        }
    };

    let globalConfig = {
        routes: defaultRoutes,
        routeConfig,
        options: Object.assign(defaultOptions, options),
    };

    function createRoute(config) {
        server.route(config);
    }

    function filter(model, datas) {
        let attrs =  validateFunc(model, datas);

        return model.query(function (qb) {
            for (let attr in attrs) {
                let data = attrs[attr];
                let operator = data[0];
                let value = data.substr(1);

                if (operator == '<') {
                    qb.andWhere(attr, '<', value);
                } else if (operator == '>') {
                    qb.andWhere(attr, '>', value);
                } else if (operator == '~') {
                    qb.andWhere(attr, 'like', value);
                }
            }
        });
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

        return result.value;
    }

    function createRelation(model, data) {
        let relations = [];

        for(let key in data) {
            if(key in model && typeof model[key] == 'function') {
                relations.push({
                    name: key,
                    data: data[key],
                });
            }
        }

        if(!relations.length) {
            return model;
        }

        return Promise.all(
            relations.map(function (relation) {
                let { name, data } = relation;
                let related = model[name]();

                data[related.relatedData.foreignKeyTarget] = related.relatedData.parentId;

                return related
                    .save(data)
                    .then(function (saved) {
                        model.set(name, saved);

                        return model;
                    });
            })
        ).then(function (models) {
            return models[0];
        });
    }

    for(let route in globalConfig.routes) {
        plugin[route] = function (localOptions, localRouteConfig) {
            overrideRoute(route, localOptions, localRouteConfig);

            return plugin;
        };
    }

    plugin['generateRoutes'] = function () {
        let { routes } = globalConfig;

        for(let routeName in routes) {
            let { options, routeConfig } = routes[routeName];
            let finalOptions = Object.assign({}, globalConfig.options, options);
            let finalRouteConfig = Object.assign({}, globalConfig.routeConfig, routeConfig);

            let route = new Route(finalOptions, finalRouteConfig);

            createRoute(route.getConfig());
        }
    };

    return plugin;
};