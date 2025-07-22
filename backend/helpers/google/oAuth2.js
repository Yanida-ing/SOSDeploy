const instance = require('axios');

instance.defaults.baseURL = 'https://www.googleapis.com';

instance.defaults.headers = {
    "Content-Type": "application/json"
}

exports.onQuery = async function (request, response, next) {

    var config = {};

    var params = {};
    params.alt = "json";
    params.access_token = request.body.token
    config.params = params;

    var response = await instance.get("/oauth2/v3/userinfo",config)
    console.log(response)
};
