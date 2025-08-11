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

      // Remove manual CORS headers and OPTIONS handler (now handled by middleware)

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
