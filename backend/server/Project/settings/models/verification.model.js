'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Setting_VerificationSchema = new Schema({
    title           : [{
        key            : {type: String, default: null},
        value          : {type: String, default: null},
    }],
    description     : [{
        key            : {type: String, default: null},
        value          : {type: String, default: null},
    }],
    status          : {type: Schema.ObjectId, ref: 'Setting_Status', default : "6548516f7ab25be71bbeeed2"},
    create          : {
        by              : {type: Schema.ObjectId, ref: 'Infomation_Admins'},
        datetime        : {type: Date, default: Date.now}
    },

});

var Setting_Verification = mongoose.model('Setting_Verification', Setting_VerificationSchema, 'Setting_Verification');
module.exports = Setting_Verification;
