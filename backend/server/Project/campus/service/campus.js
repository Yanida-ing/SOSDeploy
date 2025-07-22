var mongo = require('mongodb');
var Campus = require('../controller/campus');
const resMsg = require("../../../Project/settings/service/message");

exports.onQuery = async function (request, response, next) {
    try {

        var querys = {};
        const doc = await Campus.onQuery(querys);

        var resData = await resMsg.onMessage_Response(0,20000)
        resData.data = doc
        response.status(200).json(resData);

    } catch (err) {
        var resData = await resMsg.onMessage_Response(0,40400)
        response.status(404).json(resData);
    }
};
exports.onQuerys = async function (request, response, next) {
    try {

        var querys = {};

        const doc = await Campus.onQuerys(querys);

        var resData = await resMsg.onMessage_Response(0,20000)
        console.log(resData)
        resData.data = doc
        response.status(200).json(resData);

    } catch (err) {
        console.log(err)
        var resData = await resMsg.onMessage_Response(0,40400)
        response.status(404).json(resData);
    }
};
exports.onCreate = async function (request, response, next) {
    try {
        const doc = await Campus.onCreate(request.body);

        var resData = await resMsg.onMessage_Response(0,20000)
        resData.data = doc
        response.status(200).json(resData);

    } catch (err) {
        var resData = await resMsg.onMessage_Response(0,40400)
        response.status(404).json(resData);
    }
};
exports.onUpdate = async function (request, response, next) {
    try {

        var query = {}
        query._id = new mongo.ObjectId(request.body._id);

        const doc = await Campus.onUpdate(query,request.body);


        var resData = await resMsg.onMessage_Response(0,20000)
        resData.data = doc
        response.status(200).json(resData);

    } catch (err) {
        v
        var resData = await resMsg.onMessage_Response(0,40400)
        response.status(404).json(resData);
    }
};
exports.onDelete = async function (request, response, next) {
    try {

        var query = {};
        query._id = new mongo.ObjectId(request.body.id)
        const doc = await Campus.onDelete(query);

        var resData = await resMsg.onMessage_Response(0,20000)
        resData.data = doc
        response.status(200).json(resData);

    } catch (err) {

        var resData = await resMsg.onMessage_Response(0,40400)
        response.status(404).json(resData);
    }

};
