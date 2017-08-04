const joi = require('joi');

module.exports = (bookshelfInstance) => {
  let Car = bookshelfInstance.Model.extend({
      tableName: 'car',
      schema: {
          name: joi.string(),
          model: joi.string(),
      },
      user(){
        user.relation = true;

        return this.belongsTo(User);
      }
  });

  function car() {
    return this.hasOne(Car);
  }
  car.relation = true;

  let User = bookshelfInstance.Model.extend({
      tableName: 'user',
      schema: {
          name: joi.string(),
          phone: joi.string().required(),
          height: joi.number(),
          birth: joi.date(),
      },
      car,
  });

  return User;
}
