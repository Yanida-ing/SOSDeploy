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
      src: String,
      name: String 
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
  },
  // เพิ่ม field สำหรับ case management
  caseManagement: {
    isOpen: {
      type: Boolean,
      default: false
    },
    openedBy: {
      type: String, // เปลี่ยนจาก ObjectId เป็น String
      default: null
    },
    openedAt: {
      type: Date,
      default: null
    },
    openedReason: {
      type: String,
      default: null
    },
    closedBy: {
      type: String, // เปลี่ยนจาก ObjectId เป็น String
      default: null
    },
    closedAt: {
      type: Date,
      default: null
    },
    closedReason: {
      type: String,
      default: null
    },
    caseHistory: [{
      action: {
        type: String,
        enum: ['opened', 'closed'],
        required: true
      },
      by: {
        type: String, // เปลี่ยนจาก ObjectId เป็น String
        required: true
      },
      at: {
        type: Date,
        default: Date.now
      },
      reason: {
        type: String,
        default: null
      }
    }]
  }
}, { timestamps: true 
} );



module.exports = mongoose.model('DisasterReport', DisasterReportSchema, 'DisasterReport');