const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const _ = require('lodash')
const mongoConnections = require('../connections/mongo')

const JobLogSchema = new mongoose.Schema({
  supporter: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  type: {
    type: Number
  },
  data: {
    result: {
      type: String
    },
    message: {
      type: String
    },
    images: {
      type: Array
    },
    supporter:{
      type: Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  id: {
    type: Schema.Types.ObjectId
  },
  createdAt: {
    type: Number,
    default: Date.now
  }
}, {id: false, versionKey: false});

module.exports = mongoConnections('master').model('JobLog', JobLogSchema);
