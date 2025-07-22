'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

const AssetCategorySchema = new Schema({
    title             : [{
        key            : {type: String, default: null},
        value          : {type: String, default: null},
    }],
    description     : [{
        key            : {type: String, default: null},
        value          : {type: String, default: null},
    }],
    timestamp       : { type: Date, default: Date.now }     
});

const AssetCategory = mongoose.model('AssetCategory', AssetCategorySchema ,'AssetCategory');
module.exports = AssetCategory;