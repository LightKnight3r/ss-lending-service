const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const _ = require('lodash')
const mongoConnections = require('../connections/mongo')
const CONSTANTS = require('../const')

const OrderLog = new mongoose.Schema({
  order: {
    type: Schema.Types.ObjectId
  },
  type: {
    type: String
  },
  shipper: {
    type: Schema.Types.ObjectId
  },
  shop: {
    type: Schema.Types.ObjectId
  },
  member: {
    type: Schema.Types.ObjectId
  },
  data: {
    type: Schema.Types.Mixed
  },
  orderInf: {
    type: Schema.Types.Mixed
  },
  createdAt: {
    type: Number,
    default: Date.now
  }
}, {id: false, versionKey: false});

OrderLog.index({order: 1});

OrderLog.statics.logOrder = function (people, orderId, type, orderInf) {
  this
    .create({
      member: people.member,
      shop: people.shop,
      shipper: people.shipper,
      order: orderId,
      type: type,
      orderInf: orderInf
    }, () => {})
}

module.exports = mongoConnections('master').model('OrderLog', OrderLog);
