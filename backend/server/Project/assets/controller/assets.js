var mongo = require('mongodb');
var objSchema = require('../models/assets.model');
const { database } = require('firebase-functions/lib/providers/firestore');

exports.onQuery = async function (query) {
    return new Promise((resolve, reject) => {
        objSchema
            .findOne(query)
            // .sort("coin")
            .populate([
                // {path : "address.province"},
                // {path : "address.district"},
                // {path : "bankInfo.bankName"}
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
            .sort({_id:-1})
            .populate([
                // {path : "address.province"},
                // {path : "address.district"},
                // {path : "bankInfo.bankName"}
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

exports.onCreateMany = async function (data) {

    return new Promise((resolve, reject) => {
        objSchema.insertMany(data, function (err, docs) {
            err ? reject(err) : resolve(docs);
        });
    });
};

exports.onUpdate = async function (query,data) {
    return new Promise((resolve, reject) => {
        objSchema
            .findOneAndUpdate(query, data, { new: true, returnOriginal: false, upsert: true })
            .populate([
                // {path : "address.province"},
                // {path : "address.district"},
                // {path : "bankInfo.bankName"}
            ])
            .lean()
            .exec(function (err, doc) {
                err ? reject(err) : resolve(doc);
            });
    });
}

exports.onUpdateMany = async function (data) {
  const updatePromises = data
    .filter(item => item._id)
    .map(item => {
      const query = { _id: new mongo.ObjectId(item._id) };
      const updateData = { ...item };
      delete updateData._id;

      return objSchema
        .findOneAndUpdate(query, updateData, { new: true, upsert: true })
        // .populate([...])
        .lean()
        .exec()
        .catch(err => ({ error: err.message, _id: item._id }));
    });

  return Promise.all(updatePromises);
};

exports.onDelete = async function (query) {

    return new Promise((resolve, reject) => {
        objSchema
            .deleteOne(query)
            .exec(function (err, doc) {
                err ? reject(err) : resolve(doc);
            });
    });
}

exports.onDeleteMany = async function (idArray) {
    return new Promise((resolve, reject) => {
        const objectIds = idArray.map(id => new mongo.ObjectId(id));
        objSchema
            .deleteMany({ _id: { $in: objectIds } })
            .exec(function (err, doc) {
                err ? reject(err) : resolve(doc);
            });
    });
};






