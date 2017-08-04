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

test.serial.cb(`GET /user`, function (t) {
    request(
        {
            proxy: false,
            url: `${url}/user`,
            qs: {
              order: 'phone',
            },
        },
        function (err, response, body) {
          console.log(body);
            t.is(response.statusCode, 200, JSON.stringify(body));
            t.end();
        }
    );
});

test.serial.cb(`POST /user`, function (t) {
    request.post(
        {
            proxy: false,
            url: `${url}/user`,
            json: true,
            body: {
              phone: '99888777',
              car: {
                model: 'Jeep',
              }
            }
        },
        function (err, response, body) {
            t.is(response.statusCode, 201, JSON.stringify(body));
            t.end();
        }
    );
});
