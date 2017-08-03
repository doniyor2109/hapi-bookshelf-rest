const path = require('path');
// Update with your config settings.

module.exports = {
  development: {
      client: 'sqlite',
      connection: {
          filename: './test.db',
      },
      migrations: {
          directory: path.resolve(__dirname, './migrations')
      },
      seeds: {
          directory: path.resolve(__dirname, './seeds')
      },
      debug: true,
  },
};
