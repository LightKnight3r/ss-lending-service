const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const _ = require('lodash')
const mongoConnections = require('../connections/mongo')

const ReasonBlock = new mongoose.Schema({
  member: {
    type: Schema.Types.ObjectId
  },
  message: {
    type: String
  },
  createdAt: {
    type: Number,
    default: Date.now
  }
}, {id: false, versionKey: false});

module.exports = mongoConnections('master').model('ReasonBlock', ReasonBlock);
