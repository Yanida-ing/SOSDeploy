var mongo = require('mongodb');
var objSchema = require('../models/message.model');

exports.onQuery = async function (query) {
    return new Promise((resolve, reject) => {
        objSchema
            .findOne(query)
            .lean()
            .exec(function (err, doc) {
                err ? reject(err) : resolve(doc);
            })
    });
}
exports.onQuerys = async function (query) {
    return new Promise((resolve, reject) => {
        objSchema
            .find(query)
            .sort({_id:-1})
            .lean()
            .exec(function (err, doc) {
                err ? reject(err) : resolve(doc);
            })
    });
}
exports.onCreate = async function (data) {
    return new Promise((resolve, reject) => {
        var objSchemas = new objSchema(data);
        objSchemas.save(function (err, doc) {
            err ? reject(err) : resolve(doc);
        });
    });
}
exports.onUpdate = async function (query,data) {
    return new Promise((resolve, reject) => {
        objSchema
            .findOneAndUpdate(query, data, { new: true, returnOriginal: false, upsert: true })
            .lean()
            .exec(function (err, doc) {
                err ? reject(err) : resolve(doc);
            });
    });
}
exports.onDelete = async function (query) {

    return new Promise((resolve, reject) => {
        objSchema
            .remove(query)
            .lean()
            .exec(function (err, doc) {
                err ? reject(err) : resolve(doc);
            });
    });
}



