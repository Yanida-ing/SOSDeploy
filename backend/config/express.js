// app.js
const express = require('express');
const initialize = require("../helpers/initialize");
const middlewares = require('../middleware/middlewares');
const swagger = require('../swagger/swagger');
const routes = require('../server/routes/app.routes');

let isReady = false;

module.exports = function () {
  const app = express();

  // Swagger setup
  swagger(app);

  initialize.init(function (status) {
    if (status) {
      middlewares(app);

      app.use(function (req, res, next) {
        if (req.method === "OPTIONS") {
          const headers = {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, GET, PUT, DELETE, PATCH, OPTIONS",
            "Access-Control-Allow-Headers": "X-Requested-With, Content-Type, Accept, Authorization, Access-Control-Allow-Headers, X-Access-Token"
          };
          res.writeHead(200, headers);
          res.end();
        } else {
          res.header("Access-Control-Allow-Origin", "*");
          next();
        }
      });

      // Load routes
      routes(app);

      app.get('/healthz', (req, res) => {
        if (isReady) {
          res.status(200).send('OK');
        } else {
          res.status(503).send('Service Unavailable');
        }
      });

      setTimeout(() => {
        isReady = true;
      }, 10000);
    }
  });

  return app;
};
