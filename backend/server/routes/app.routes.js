const sttingsRoutes = require("../Project/settings/sttings.routes");
const addressRoutes = require("../Project/address/address.routes");
const assetsRoutes = require("../Project/assets/assets.routes");
const reportRoutes = require("../Project/report/report.routes");
const chatRoutes = require("../Project/chat/chat.routes");



module.exports = function (app) {

  var path = "/api/v1";

  app.use(path + '/setting', sttingsRoutes);
  app.use(path + '/address', addressRoutes);
  app.use(path + '/assets', assetsRoutes);
  app.use(path + '/report', reportRoutes);
  app.use(path + '/chat', chatRoutes);

  // API routes for frontend
  // app.use(path , accountsRoutes);

};
