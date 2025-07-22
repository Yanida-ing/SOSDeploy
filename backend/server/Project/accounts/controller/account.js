var mongo = require('mongodb');
var objSchema = require('../models/account.model');

exports.onQuery = async function (query) {
    return new Promise((resolve, reject) => {
        objSchema
            .findOne(query)
            .populate([
                // {path : "verification.type", select:"title status"},
                // {path : "verification.status", select:"title"}
                // {path : "campusId", select:"title"},
                // {path : "facultyId", select:"title code"},
                // {path : "departmentId", select:"title code"},
                // {path : "status", select:"title"},
                // {path : "role", select:"title"},
            ])
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
            // .sort({_id:-1})
            .populate([
                // {path : "campusId", select:"title"},
                // {path : "facultyId", select:"title code"},
                // {path : "departmentId", select:"title code"},
                // {path : "status", select:"title"},
                // {path : "role", select:"title"},
            ])
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
            .populate([
                // {path : "campusId", select:"title"},
                // {path : "facultyId", select:"title code"},
                // {path : "departmentId", select:"title code"},
                // {path : "status", select:"title"},
                // {path : "role", select:"title"},
            ])
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



