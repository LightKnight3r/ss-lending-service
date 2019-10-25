const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const _ = require('lodash')
const mongoConnections = require('../connections/mongo')

const StringeeLog = new mongoose.Schema({
  memberPhone: {
    type: String
  },
  member: {
    type: Schema.Types.ObjectId
  },
  order: {
    type: Schema.Types.ObjectId
  },
  customerPhone: {
    type: String
  },
  stringeePhone: {
    type: String
  },
  createdAt: {
    type: Number,
    default: Date.now
  }
}, {id: false, versionKey: false});

module.exports = mongoConnections('master').model('StringeeLog', StringeeLog);
