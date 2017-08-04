# hapi-bookshelf-rest
REST Full API for hapi framework based on bookshelf models

# Usage

## Getting Started


### Installation
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
   model: BookshelfModel,
   bookshelf: bookshelf,
}).generateRoutes();
```

This is the basic configuration for REST API.

### Customize your rest route

```javascript
const rest = require('hapi-bookshelf-rest');

rest(server, {
   path: '/user',
   model: BookshelfModel,
   bookshelf: bookshelf,
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


## API

* `require('hapi-bookshelf-rest')([options], [routeConfig])` -> `Rest{Object}`
   * `[options]` - global options for every route
      * `path` - base path for REST API.
      * `model` - resource model
      * `bookshelf` - bookshelf instance
   * `[routeConfig]` - global route config for every route - same as Hapi route options
* `Rest{Object}`
   
