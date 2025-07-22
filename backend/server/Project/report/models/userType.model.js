'use strict';

const mongoose = require('mongoose');

const userTypeSchema = new mongoose.Schema({
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



module.exports = mongoose.model('userType', userTypeSchema, 'userType'); 