const joi = require('joi');

module.exports = (bookshelfInstance) => {
      let User = bookshelfInstance.Model.extend({
          tableName: 'user',
          schema: {
              name: joi.string(),
              phone: joi.string().required(),
              height: joi.number(),
              birth: joi.date(),
              car_id: joi.number(),
          },
          car(){
              return this.hasOne(Car, 'id', 'car_id');
          }
      });

    let Car = bookshelfInstance.Model.extend({
        tableName: 'car',
        schema: {
            name: joi.string(),
            model: joi.string(),
        },
        user(){
            return this.belongsTo(User, 'id', 'car_id');
        }
    });

  return Car;
};
