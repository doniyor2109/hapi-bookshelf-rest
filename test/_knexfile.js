const path = require('path');

module.exports = {
  development: {
      client: 'sqlite',
      connection: {
          filename: './test.db',
      },
      migrations: {
          directory: path.resolve(__dirname, 'migrations')
      },
      seeds: {
          directory: path.resolve(__dirname, 'seeds')
      },
      debug: false,
  },
};
