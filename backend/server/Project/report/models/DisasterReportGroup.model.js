'use strict';

const mongoose = require('mongoose');

const DisasterReportGroupSchema = new mongoose.Schema({
  name: { type: String, required: false }, // ชื่อกลุ่ม (optional)
  description: { type: String, required: false },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Information_Accounts', required: false },
  createdAt: { type: Date, default: Date.now },
  reports: [{ type: mongoose.Schema.Types.ObjectId, ref: 'DisasterReport' }], // รายงานที่อยู่ในกลุ่มนี้
});

module.exports = mongoose.model('DisasterReportGroup', DisasterReportGroupSchema, 'DisasterReportGroup'); 