const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const _ = require('lodash')
const mongoConnections = require('../connections/mongo')

const GuideOrder = new mongoose.Schema({
  imageUrl: {
    type: String
  },
  message: {
    type: String
  },
  order: {
    type: Number
  },
  active: {
    type: Number
  },
  createdAt: {
    type: Number,
    default: Date.now
  }
}, {id: false, versionKey: false});

GuideOrder.statics.list = function (cb) {
  this
    .find({active: 1}, null, { sort: { order: 1}})
    .lean()
    .exec(cb)
}

GuideOrder.index({active: 1, order: 1})


module.exports = mongoConnections('master').model('GuideOrder', GuideOrder);
