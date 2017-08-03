const joi = require('joi');

module.exports = (bookshelfInstance) => {
  return bookshelfInstance.Model.extend({
      tableName: 'user',
      schema: {
          name: joi.string(),
          height: joi.number(),
          birth: joi.date(),
      },
  });
}
