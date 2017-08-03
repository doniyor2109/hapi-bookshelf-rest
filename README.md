# hapi-bookshelf-rest
REST Full API for hapi framework based on bookshelf models

# Usage

## Getting Started


### Prerequisites
```javascript
npm

npm install hapi-bookshelf-rest

or 

yarn

yarn add hapi-bookshelf-rest
```
## Options

path - base path


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
