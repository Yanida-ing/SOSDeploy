var mongo = require('mongodb');
const disasterType = require('../controller/disasterType');
const resMsg = require("../../settings/service/message");

exports.onQuery = async function (request, response, next) {
    try {
        var querys = {};
        if (request.params && request.params.id) {
            querys._id = request.params.id;
        }
        const doc = await disasterType.onQuery(querys);
        var resData = await resMsg.onMessage_Response(0,20000)
        resData.data = doc;
        response.status(200).json(resData);
    } catch (err) {
        var resData = await resMsg.onMessage_Response(0,40400)
        response.status(404).json(resData);
    }
};

exports.onQuerys = async function (request, response, next) {
    try {
        var querys = {}

        const doc = await disasterType.onQuerys(querys);
        var resData = await resMsg.onMessage_Response(0,20000)
        resData.data = doc;
        response.status(200).json(resData);
    } catch (err) {
        var resData = await resMsg.onMessage_Response(0,40400)
        response.status(404).json(resData);
    }
};

exports.onCreate = async function (request, response, next) {
    try {
        if (Array.isArray(request.body)) {
            const doc = await disasterType.onCreateMany(request.body);
            var resData = await resMsg.onMessage_Response(0,20000)
            resData.data = doc;
            response.status(200).json(resData);
        } else {
            const doc = await disasterType.onCreate(request.body);
            var resData = await resMsg.onMessage_Response(0,20000)
            resData.data = doc;
            response.status(200).json(resData);
        }
    } catch (err) {
        var resData = await resMsg.onMessage_Response(0,40400)
        response.status(404).json(resData);
        console.log(err);
    }
};

exports.onUpdate = async function (request, response, next) {
    try {
        let resData;
        if (Array.isArray(request.body)) {
            const doc = await disasterType.onUpdateMany(request.body);  
            resData = await resMsg.onMessage_Response(0, 20000);
            resData.data = doc;
        } else {
            const query = { _id: new mongo.ObjectId(request.body._id) };
            const doc = await disasterType.onUpdate(query, request.body);
            resData = await resMsg.onMessage_Response(0, 20000);
            resData.data = doc;
        }

        return response.status(200).json(resData);
    } catch (err) {
        const resData = await resMsg.onMessage_Response(0, 40400);
        return response.status(404).json(resData);
    }
};

exports.onDelete = async function (request, response, next) {
    try {
    if (Array.isArray(request.body.id)) {
        const doc = await disasterType.onDeleteMany(request.body.id);
        const resData = await resMsg.onMessage_Response(0, 20000);
            resData.data = doc;
                return response.status(200).json(resData);
    } else {
        const id = request.body.id;
        if (!mongo.ObjectId.isValid(id)) {
            const resData = await resMsg.onMessage_Response(0, 40000); 
                 return response.status(400).json(resData);
    }
        const query = { _id: new mongo.ObjectId(id) };
        const doc = await disasterType.onDelete(query);
        const resData = await resMsg.onMessage_Response(0, 20000);
            resData.data = doc;
                return response.status(200).json(resData);
    }
    } catch (err) {
        const resData = await resMsg.onMessage_Response(0, 40400);
            return response.status(404).json(resData);
    }
    };




