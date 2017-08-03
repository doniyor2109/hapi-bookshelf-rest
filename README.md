# hapi-bookshelf-rest
REST Full API for hapi framework based on bookshelf models

# Usage

## Configure your REST
```javascript
const rest = require('hapi-bookshelf-rest');

rest(server, {
   path: '/user',
   model: UserBookshelfModel
}).generateRoutes();
```

Your REST API is ready for user route.

### Customize your rest route

```javascript
const rest = require('hapi-bookshelf-rest');

rest(server, {
   path: '/user',
   model: UserBookshelfModel
})
.readAll({
     queryFilter: function(request) {
         return {
            id: request.auth.credentials.id,
         }
     }
})
.generateRoutes();
```
