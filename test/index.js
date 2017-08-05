const request = require('request');
const joi = require('joi');
const { test } = require('ava');

test.serial('starting server', (t) => {
    return require('./_db')
        .then((bookshelfInstance) => {
            return require('./_server')(t, bookshelfInstance);
        });
});

let url = 'http://localhost:5153';

test.serial.cb(`GET /car`, function (t) {
    request(
        {
            proxy: false,
            url: `${url}/car`,
            qs: {
                order: 'phone',
            },
        },
        function (err, response, body) {
            t.is(response.statusCode, 200, JSON.stringify(body));
            t.end();
        }
    );
});

test.serial.cb(`GET /car/1`, function (t) {
    request(
        {
            proxy: false,
            url: `${url}/car/1`,
            qs: {
                order: 'phone',
            },
        },
        function (err, response, body) {
            t.is(response.statusCode, 200, JSON.stringify(body));
            t.end();
        }
    );
});

test.serial.cb(`GET /car/one`, function (t) {
    request(
        {
            proxy: false,
            url: `${url}/car/one`,
        },
        function (err, response, body) {
            t.is(response.statusCode, 200, JSON.stringify(body));
            t.end();
        }
    );
});

test.serial.cb(`POST /car`, function (t) {
    request.post(
        {
            proxy: false,
            url: `${url}/car`,
            json: true,
            body: {
                name: '99888777',
                user: {
                    name: 'Jeep',
                    phone: '123231',
                }
            }
        },
        function (err, response, body) {
            console.log(body);

            t.is(response.statusCode, 201, JSON.stringify(body));
            t.end();
        }
    );
});