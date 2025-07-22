/**
 * Created by sherlock on 01/02/2017.
 */

var os = require("os");
require('dotenv').config();

module.exports = {
    debug: true,
    key:process.env.KEY,
    mongoURI: process.env.MONGODB,
    // mongoURI: 'mongodb+srv://'+process.env.MONGO_USER+':'+process.env.MONGO_PASS+'@'+process.env.MONGO_HOST+'/'+process.env.MONGO_NAME+'?authSource=admin',
    timeout: process.env.TIMEOUT,
    tokenLength: process.env.TOKENLANGTH,
    tokenExpired: (86400000 * process.env.TOKENEXPIRED),
    transactionExpired: (60000 *process.env.TRANSACTIONEXPIRED),
    host: {
        name: os.hostname(),
        url:process.env.BASE_SERVER_URL,
        port: process.env.PORT
    },

    images_part : {
        profile : "profile/",
        ranks : "ranks/"
    }



};
