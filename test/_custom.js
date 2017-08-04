const db = require('./_db');

db.then((bookshelfInstance) => {
    return require('./_server')(null, bookshelfInstance);
});