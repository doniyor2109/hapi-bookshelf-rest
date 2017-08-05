# hapi-bookshelf-rest
REST Full API for hapi framework based on bookshelf models


## Getting Started


### Installation

#### npm
```javascript
npm install hapi-bookshelf-rest
```

#### yarn
```
yarn add hapi-bookshelf-rest
```

#### git
```
git clone https://github.com/doniyor2109/hapi-bookshelf-rest
```
## Introduction
This plugin provides easy way to develop REST API server with few configuration. There is already built in standarts that you can use. If there is standarts that plugin does not have please [issue](https://github.com/doniyor2109/hapi-bookshelf-rest/issues) this standart.

## Configure your REST
```javascript
const rest = require('hapi-bookshelf-rest');

rest(server, {
   path: '/user',
   model: BookshelfModel,
   bookshelf: bookshelf,
}).generateRoutes();
```

This is the basic configuration for REST API. These lines of codes provide full featured REST API for `user` resource. You can configure your routes with options and routeConfig.

### Customize your rest route

```javascript
const rest = require('hapi-bookshelf-rest');

rest(server, {
   path: '/user',
   model: BookshelfModel,
   bookshelf: bookshelf,
}).readAll({
     queryFilter: function(request) {
         return {
            id: request.auth.credentials.id,
         }
     }
}).generateRoutes();
```

This route is configured that whenever user requests `GET /user` path (readAll), user resource will be fetched with condition that `id` should be equal to `request.auth.credentials.id`.
This configuration is belongs to only `GET /user` path (readAll).


## API

`rest = require('hapi-bookshelf-rest')`

* `rest(server, [options], [routeConfig])` : `Rest object`
   * `server`: `object` - hapi server instance
   * `[options]`: `object` - global options
   * `[routeConfig]`: `object` - global route configuration
* `Rest Object` -  sets configuration and options for routes
   * `readOne([options], [routeConfig])` - reads one resource - `GET /path/{id}` 
   * `readAll([options], [routeConfig])` -  reads all resource - `GET /path` 
   * `create([options], [routeConfig])` - creates new resource - `POST /path` 
   * `batch([options], [routeConfig])` -  creates multuple resources - `POST /path/batch` 
   * `update([options], [routeConfig])` - updates resource - `PUT /path/{id}` 
   * `delete([options], [routeConfig])` - deletes resource - `DELETE /path/{id}` 
   * `generateRoutes()` - generates routes

### Options

* `[options]`: `object` - global options for every route
   * `path`: `string` - base path for REST API.
   * `model`: `bookshelfModel object` - resource model
   * `bookshelf`: `BookshelfInstance object` - bookshelf instance
   * `[queryFilter]`: `function` - modify query
   * `[payloadFilter]`: `function` - modify payload
   * `[deny]`: `function` - if returns true then user is not allowed to this route
* `[routeConfig]`: `object` - global route config for every route - same as Hapi route options
   * `handler`: `function` - route handler function
   * ... .etc

   
