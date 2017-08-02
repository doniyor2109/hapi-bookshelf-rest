# hapi-bookshelf-rest
REST Full API for hapi framework based on bookshelf models

#Usage

## Configure your REST
```javascript
const rest = require('hapi-bookshelf-rest');

rest(server, {
   path: '/user',
   model: UserBookshelfModel
});
```

That is it. Your REST API is ready for user route.
