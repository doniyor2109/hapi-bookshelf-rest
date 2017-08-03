const request = require('request');
const joi = require('joi');
const hapi = require('hapi');
const knex = require('knex');
const bookshelf = require('bookshelf');
const { test } = require('ava');

const rest = require('../lib/index');
let knexConfig = require('./_knexfile');
let knexInstance = require('knex')(knexConfig['development']);
let bookshelfInstance = require('bookshelf')(knexInstance);

test.serial('starting server', (t) => {
    return knexInstance
        .migrate.latest()
        .then(function() {
            return knexInstance.seed.run();
        })
        .then(function() {
            let User = bookshelfInstance.Model.extend({
                tableName: 'user',
                schema: {
                    name: joi.string(),
                    height: joi.number(),
                    birth: joi.date(),
                },
            });

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
                rest(server, {
                    path: '/user',
                    model: User,
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
                            t.pass();
                        });
                })
                .catch(err => {
                    t.fail();
                    console.log(err);
                });
        });
});



let url = 'http://localhost:5153';

test.serial.cb(`GET /user`, function (t) {
    request(
        {
            proxy: false,
            url: `${url}/user`,
        },
        function (err, response, body) {
            t.is(response.statusCode, 200, JSON.stringify(body));
            t.end();
        }
    );
});
