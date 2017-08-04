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
      rest(server, {
          path: '/user',
          model: require('./_model')(bookshelfInstance),
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
};
