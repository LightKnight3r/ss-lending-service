const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const _ = require('lodash')
const mongoConnections = require('../connections/mongo')

const ReasonCancel = new mongoose.Schema({
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
  region: {
    type: String
  }
}, {id: false, versionKey: false});
ReasonCancel.index({
  order:1
})

module.exports = mongoConnections('master').model('ReasonCancel', ReasonCancel);
