const boom = require("boom");

function Route(options, routeConfig) {
    let internal = options;

    internal.getQuery = function() {
        let { query } = internal.request;

        if (internal.filterQuery && typeof internal.filterQuery == "function") {
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
        let  { payload } = internal.request;

        if (internal.filterPayload && typeof internal.filterPayload == "function") {
            let filtered;

            if(payload.length) {
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

            return oldHandler.call(internal, request, reply);
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
                    let{ model } = this;
                    let data = this.getQuery();

                    return model
                        .where(data)
                        .fetchAll();
                }
            },
            routeConfig: {
                path: options.path,
                method: "GET",
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
                    let{ params } = this.request;
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
                method: "GET",
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

                    data[modelInstance.idAttribute] = this.request.params.id;

                    return this
                        .model
                        .forge()
                        .save(data);
                }
            },
            routeConfig: {
                path:  `${options.path}/{id}`,
                method: "PUT",
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
                    let{ params } = this.request;
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
                method: "DELETE",
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
                    let{ model } = this;
                    let modelInstance = model.forge();
                    let{ idAttribute } = modelInstance;
                    let data = this.getPayload();

                    if(data[idAttribute]) {
                        delete data[idAttribute];
                    }

                    return model
                        .forge()
                        .save(data);
                }
            },
            routeConfig: {
                path: options.path,
                method: "POST",
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

                    return model
                        .forge()
                        .batch(data);
                }
            },
            routeConfig: {
                path: `${options.path}/batch`,
                method: "POST",
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

    let globalConfig = {
        routes: defaultRoutes,
        routeConfig,
        options,
    };

    function createRoute(config) {
        server.route(config);
    }

    function overrideRoute(routeName, localOptions, localRouteConfig) {
        let{ options, routeConfig } = globalConfig.routes[routeName];

        globalConfig.routes[routeName] = {
            routeConfig: Object.assign(routeConfig, localRouteConfig),
            options: Object.assign(options, localOptions),
        };
    }


    for(let route in globalConfig.routes) {
        plugin[route] = function (localOptions, localRouteConfig) {
            overrideRoute(route, localOptions, localRouteConfig);

            return plugin;
        };
    }

    plugin["generateRoutes"] = function () {
        let{ routes } = globalConfig;

        for(let routeName in routes) {
            let{ options, routeConfig } = routes[routeName];
            let finalOptions = Object.assign({}, globalConfig.options, options);
            let finalRouteConfig = Object.assign({}, globalConfig.routeConfig, routeConfig);

            let route = new Route(finalOptions, finalRouteConfig);

            createRoute(route.getConfig());
        }
    };

    return plugin;
};