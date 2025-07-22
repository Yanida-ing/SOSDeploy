'use strict';

var mongoose    = require('mongoose');
var Schema      = mongoose.Schema;

var Setting_MessagesSchema  = new Schema({
    number          : {type: Number, required: true},
    code            : {type: Number, required: true},
    httpcode        : {type: Number, required: true},
    message         : [{
        key		        : {type: String, default: null}, // th,en
        value		    : {type: String, default: null}  // message
    }],
    enable          : {type: Boolean, default: true},

});

var Setting_Messages = mongoose.model('Setting_Messages', Setting_MessagesSchema, 'Setting_Messages');
module.exports = Setting_Messages;
