const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const _ = require('lodash')
const mongoConnections = require('../connections/mongo')

const PromoteLog = new mongoose.Schema({
  order: {
    type: Schema.Types.ObjectId,
    ref: 'OrderSystem'
  },
  shipper: {
    type: Schema.Types.ObjectId
  },
  shop: {
    type: Schema.Types.ObjectId
  },
  promote: {
    type: Schema.Types.ObjectId
  },
  status: {
    type: Number
  },
  message: {
    type: String
  },
  error: {
    type: Schema.Types.Mixed
  },
  region: {
    type: String
  },
  createdAt: {
    type: Number,
    default: Date.now
  }
}, {id: false, versionKey: false, strict: false});

module.exports = mongoConnections('master').model('PromoteLog', PromoteLog);
