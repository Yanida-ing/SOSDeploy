'use strict';

const mongoose = require('mongoose');
const DisasterReportSchema = new mongoose.Schema({

  type: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'DisasterType',
    required: true 
  },
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'userType',
    required: true 
  },
  location: {
    type: {
      type: String,
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    },
    address: String
  },
  level: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'DisasterLevel',
    required: false 
  },
  reasoning: String,
  description: {
    type: String,
    required: true
  },
  media: [
    {
      type: { type: String, required: true },
      src: String
    }
  ],
  contact: {
    name: String,
    phone: String,
    email: String,
  },

  timeStamps: {
    type: Date, 
    default: Date.now
  },

  tracking : [{
    status :  { type: mongoose.Schema.Types.ObjectId, ref: 'Status' },
    timeStamps : {
      type: Date, 
      default: Date.now
    },
    by :  { type: mongoose.Schema.Types.ObjectId, ref: 'Information_Accounts', required: false },
  }],
  assets : [{
    id : { type: mongoose.Schema.Types.ObjectId, ref: 'Explorer_Assets' },
    amount : Number,
    status : [{}],
 }],
  status: {
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Status',
  },
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DisasterReportGroup',
    default: null
  }
}, { timestamps: true 
} );



module.exports = mongoose.model('DisasterReport', DisasterReportSchema, 'DisasterReport');