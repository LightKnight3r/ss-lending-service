const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const _ = require('lodash')
const mongoConnections = require('../connections/mongo')

const ReportOrder = new mongoose.Schema({
  order: {
    type: Schema.Types.ObjectId,
    ref: 'OrderSystem'
  },
  message: {
    type: String
  },
  createdAt: {
    type: Number,
    default: Date.now
  },
  shipper: {
    type: Schema.Types.ObjectId,
    ref:'Member'
  },
  shop: {
    type: Schema.Types.ObjectId,
    ref:'Member'
  },
  type:{
    type: Number
  },
  statusOrder:{
    type: Number
  },
  status:{
    type: Number,
    default: 0
  },
  region: {
    type: String
  }
}, {id: false, versionKey: false});


module.exports = mongoConnections('master').model('ReportOrder', ReportOrder);
