var mongo = require('mongodb');
var moment = require('moment');
const Utils = require("../../../../helpers/utils");
const Config = require("../../../../config/config");
const resMsg = require("../../../Project/setting/messages/service/Setting_Message");
var Account = require('../controller/account');


exports.onCheckAuthorization = async function (request, response, next) {
    try {
        var querys = {};

        querys['control.device.xAccessToken'] = request.headers['x-access-token'];
        // querys['control.device.expired_key'] = {$lte: new moment().unix()}

        const isDoc = await Account.onQuery(querys);
        if(isDoc != null){
            request.body.accounts = new mongo.ObjectId(isDoc._id)
            return next();
        }else{
            var resData = await resMsg.onMessage_Response(0,40100)
            response.status(401).json(resData);
        }

    } catch (err) {
        // console.log(err)
        var resData = await resMsg.onMessage_Response(0,40400)
        response.status(404).json(resData);
    }
};
exports.verifyIdTokenGoogle = async function (request, response, next) {
    try {
        if(request.body.token !== undefined){
            const {OAuth2Client} = require('google-auth-library');
            const client = new OAuth2Client();
            async function verify() {
                const ticket = await client.verifyIdToken({
                    idToken: request.body.token,
                    audience: "225788483142-8pkg8on8nh60ao83ve33ff3lflv2ccvo.apps.googleusercontent.com",  // Specify the CLIENT_ID of the app that accesses the backend
                    // Or, if multiple clients access the backend:
                    //[CLIENT_ID_1, CLIENT_ID_2, CLIENT_ID_3]
                });
                const payload = ticket.getPayload();
                // If the request specified a Google Workspace domain:
                // const domain = payload['hd'];
                request.body.email = payload['email'];
                return next();
            }
            verify().catch(async (error) => {
                var resData = await resMsg.onMessage_Response(0, 40400)
                response.status(404).json(resData);
            });
        }else{
            return next();
        }
    }catch (err) {
        var resData = await resMsg.onMessage_Response(0,50000)
        response.status(500).json(resData);
    }
};
exports.SingIn = async function (request, response, next) {
    try {
        let query = {};

        if (request.body.email) {
            query.email = request.body.email;
        } else if (request.body.username && request.body.password === "********") {
            var elemMatch = {};
            elemMatch.type = (request.body.type == null)? new mongo.ObjectId("66a06852660ccb1debade7c5"):new mongo.ObjectId(request.body.username)
            elemMatch.username = request.body.username;
            query.authen = { $elemMatch : elemMatch }
        } else {
            const resData = await resMsg.onMessage_Response(0, 40400);
            return response.status(404).json(resData);
        }

        // console.log(query)
        const isDoc = await Account.onQuery(query);

        if (!isDoc) {
            const resData = await resMsg.onMessage_Response(0, 40400);
            return response.status(404).json(resData);
        }

        // Check verification
        // const isVerification = isDoc.verification.filter(
        //     item => item.status !== "6548516f7ab25be71bbeeed1"
        // );

        // Limit device
        if (isDoc.control.limit <= isDoc.control.device.length) {
            await Account.onUpdate(query, {
                $pull: { "control.device": isDoc.control.device[0] }
            });
        }

        // Create new device session
        const token = await Utils.createTokens();
        const devices = {
            version: "1",
            ip: request.ip,
            device: request.get('User-Agent'),
            xAccessToken: token,
            expired_key: new moment().unix() + Config.tokenExpired,
            accounts: isDoc._id
        };

        await Account.onUpdate(query, {
            $push: { "control.device": devices }
        });

        // Clean sensitive data before response
        delete devices.ip;
        delete devices.device;

        const resData = await resMsg.onMessage_Response(0, 20000);
        resData.data = devices;
        return response.status(200).json(resData);
    } catch (err) {
        const resData = await resMsg.onMessage_Response(0, 50000);
        return response.status(500).json(resData);
    }
};
