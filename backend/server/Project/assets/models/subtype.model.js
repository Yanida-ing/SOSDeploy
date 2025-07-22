'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

const AssetSubtypeSchema = new Schema({
    title           : [{
        key            : {type: String, default: null},
        value          : {type: String, default: null},
    }],
    description     : [{
        key            : {type: String, default: null},
        value          : {type: String, default: null},
    }],
    timestamp       : { type: Date, default: Date.now },
    categoryId      : { type: Schema.ObjectId, ref: 'AssetCategory', required: true },        
});

const AssetSubtype = mongoose.model('AssetSubtype', AssetSubtypeSchema ,'AssetSubtype');
module.exports = AssetSubtype;