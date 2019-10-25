const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const _ = require('lodash')
const mongoConnections = require('../connections/mongo')

const QuestionOrder = new mongoose.Schema({
  imageUrl: {
    type: String
  },
  message: {
    type: String
  },
  answers: {
    type: Schema.Types.Mixed
  },
  rightIndexAnswer: {
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

QuestionOrder.index({active: 1, createdAt: 1});

QuestionOrder.statics.list = function (cb) {
  this
    .find({active: 1}, null)
    .lean()
    .exec(cb)
}

module.exports = mongoConnections('master').model('QuestionOrder', QuestionOrder);
