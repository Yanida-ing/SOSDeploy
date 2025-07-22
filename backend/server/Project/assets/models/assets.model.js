'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

const ExplorerAssetSchema = new Schema({

  title           : [{
        key            : {type: String, default: null},
        value          : {type: String, default: null},
    }],
  description     : [{
        key            : {type: String, default: null},
        value          : {type: String, default: null},
    }],

  category        : { type: Schema.Types.ObjectId, ref: 'AssetCategory', required: true},

  subtype         : {type: Schema.Types.ObjectId, ref: 'AssetSubtype', required: true},

  create          : {
        by            : { type: Schema.ObjectId, ref: 'Information_Admins' },
        datetime      : { type: Date, default: Date.now }
  },

  history         : [{
        state         : { type: Boolean, default: true }, // true=in, false=out
        amount        : { type: Number, default: 0 },
        account       : { type: Schema.ObjectId, ref: 'Information_Admins' },
        createdAt     : { type: Date, default: Date.now }
  }],


});

const Explorer_Assets = mongoose.model('Explorer_Assets', ExplorerAssetSchema, 'Explorer_Assets');
module.exports = Explorer_Assets;