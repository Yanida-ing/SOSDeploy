'use strict';

const mongoose = require('mongoose');

const StatusSchema = new mongoose.Schema({
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


module.exports = mongoose.model('Status', StatusSchema, 'Status'); 