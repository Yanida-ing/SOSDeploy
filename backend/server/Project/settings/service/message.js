
const mongo = require("mongodb");
var infomation_messages = require('../controller/message')
var resMsg = require('./message');


exports.onQuery = async function (request, response, next) {
    try {

        var querys = {};
        const doc = await infomation_messages.onQuery(querys);

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

        const doc = await infomation_messages.onQuerys(querys);

        // for(var i=0; i<doc.length; i++){
        //
        //     var objs = {};
        //     objs.number = doc[i].api_number
        //     objs.code = doc[i].code
        //     objs.httpcode = doc[i].httpCode
        //
        //     var messages = [];
        //
        //     var message = {};
        //     message.key = "th"
        //     message.value = doc[i].message.th;
        //     messages.push(message)
        //
        //     var message = {};
        //     message.key = "en"
        //     message.value = doc[i].message.en;
        //     messages.push(message)
        //
        //     objs.message = messages
        //     objs.enable = doc[i].enable
        //     const isCreate = await infomation_messages.onCreate(objs);
        //     console.log(objs)
        // //
        // }

        var resData = await resMsg.onMessage_Response(0,20000)
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

        const doc = await infomation_messages.onCreate(request.body);

        var resData = await resMsg.onMessage_Response(20000)
        resData.data = doc
        response.status(200).json(resData);

    } catch (err) {
        var resData = await resMsg.onMessage_Response(40400)
        response.status(404).json(resData);
    }
};

exports.onUpdate = async function (request, response, next) {
    try {

        var query = {}
        query._id = new mongo.ObjectId(request.body._id);

        const doc = await infomation_messages.onUpdate(query,request.body);


        var resData = await resMsg.onMessage_Response(0,20000)
        resData.data = doc
        response.status(200).json(resData);

    } catch (err) {
        var resData = await resMsg.onMessage_Response(0,40400)
        response.status(404).json(resData);
    }
};

exports.onDelete = async function (request, response, next) {
    try {

        var query = {};
        query._id = new mongo.ObjectId(request.params.id)
        const doc = await infomation_messages.onDelete(query);

        var resData = await resMsg.onMessage_Response(0,20000)
        resData.data = doc
        response.status(200).json(resData);

    } catch (err) {
        var resData = await resMsg.onMessage_Response(0,40400)
        response.status(404).json(resData);
    }

};



exports.onMessage_Response = async function (number, code, res) {
    try {

        var query = {};
        (number != null)? query.number = number : query.number = 0;
        (code != null)? query.code = code : null;

        var doc =  await infomation_messages.onQuery(query);
        delete doc._id;
        delete doc.create;
        delete doc.update;
        delete doc.__v;
        delete doc.number;
        delete doc.enable;

        return doc

    } catch (err) {
        return err
    }
};
