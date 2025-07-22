var mongo = require('mongodb');
const Assets= require('../controller/assets');
const resMsg = require("../../../Project/settings/service/message");

exports.onQuery = async function (request, response, next) {
    try {
        var querys = {};
        if (request.params && request.params.id) {
            querys._id = request.params.id;
        }
        const doc = await Assets.onQuery(querys);
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

        const doc = await Assets.onQuerys(querys);
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
            const doc = await Assets.onCreateMany(request.body);
            var resData = await resMsg.onMessage_Response(0,20000)
            resData.data = doc;
            response.status(200).json(resData);
        } else {
            const doc = await Assets.onCreate(request.body);
            var resData = await resMsg.onMessage_Response(0,20000)
            resData.data = doc;
            response.status(200).json(resData);
        }
    } catch (err) {
        var resData = await resMsg.onMessage_Response(0,40400)
        response.status(404).json(resData);
    }
};

exports.onUpdate = async function (request, response, next) {
    try {
        const isMany = Array.isArray(request.body);
        const items = isMany ? request.body : [request.body];

        const updated = await Promise.all(items.map(async item => {
            const old = await Assets.onQuery({ _id: item._id });
            const history = [
                ...(old?.history || []),
                {
                    state: typeof item.state === 'boolean' ? item.state : true,
                    amount: typeof item.amount === 'number' ? item.amount : 0,
                    account: item.account || null,
                    createdAt: new Date()
                }
            ];
            return Assets.onUpdate({ _id: new mongo.ObjectId(item._id) }, { ...item, history });
        }));

        const resData = await resMsg.onMessage_Response(0, 20000);
        resData.data = isMany ? updated : updated[0];
        return response.status(200).json(resData);
    } catch (err) {
        const resData = await resMsg.onMessage_Response(0, 40400);
        return response.status(404).json(resData);
    }
};

exports.onDelete = async function (request, response, next) {
    try {
    if (Array.isArray(request.body.id)) {
        const doc = await Assets.onDeleteMany(request.body.id);
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
        const doc = await Assets.onDelete(query);
        const resData = await resMsg.onMessage_Response(0, 20000);
            resData.data = doc;
                return response.status(200).json(resData);
    }
    } catch (err) {
        const resData = await resMsg.onMessage_Response(0, 40400);
            return response.status(404).json(resData);
    }
    };

