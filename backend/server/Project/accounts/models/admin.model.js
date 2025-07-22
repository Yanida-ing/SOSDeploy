'use strict';
var mongoose    = require('mongoose');
var Schema      = mongoose.Schema;

var objsSchema  = new Schema({

    dateTime                : {type: Date, default: null},

    authen                  : [{
        type                    : {type: Schema.ObjectId, ref: 'Authen_Type'},
        username                : {type: String, default: null},
        password                : {type: String, default: null},
        email                   : {type: String, default: null},
        oAuthToken              : {type: String, default: null}
    }],

    userInfo                : {
        prefix              : [{
            key                     : {type: String, default: null},
            value                   : {type: String, default: null},
        }],
        firstName           : [{
            key                     : {type: String, default: null},
            value                   : {type: String, default: null},
        }],
        lastName            : [{
            key                     : {type: String, default: null},
            value                   : {type: String, default: null},
        }],
        image               : {type: String, default: null},
        cardId              : {type: String, default: null},//citizen card id
        birthday            : {type: Date, default: null},
        msisdn              : {type: String, default: null} ,//phone number
        religion            : {type: String, default: null},
    },

    address                 : [{
        type                    : {type: Schema.ObjectId, ref: 'Address_Type'},
        address                 : {type: String, default: null},
        province                : {type: Schema.ObjectId, ref: 'Setting_Province'},
        district                : {type: Schema.ObjectId, ref: 'Setting_District'},
        subDistrict             : {type: Schema.ObjectId, ref: 'Setting_SubDistrict'},
        zipcode                 : {type: String, default: null},
        gps                     : {
            latitude                : {type: Number, default: null},
            longitude               : {type: Number, default: null},
        }
    }],

    status                  : {type: Schema.ObjectId, ref: 'Setting_Status', default: new Object("63fb5ffb9c438d82661190bc")},

});


var Information_Accounts = mongoose.model('Information_Accounts', objsSchema, 'Information_Accounts');
module.exports = Information_Accounts;

