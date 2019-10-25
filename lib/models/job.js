const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const _ = require('lodash')
const mongoConnections = require('../connections/mongo')

const JobSchema = new mongoose.Schema({
  type: {
    type: Number
  },
  idSource: {
    type: Schema.Types.ObjectId
  },
  status: {
    type: Number,
    default: 0
  },
  result: {
    type: String
  },
  willProcessAt: {
    type: Number,
    default: Date.now
  },
  supporter: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  member : {type: mongoose.Schema.Types.ObjectId, ref: 'Member'},
  createdAt: {
    type: Number,
    default: Date.now
  },
  finishedAt: {
    type: Number,
    default: Date.now
  }
}, {id: false, versionKey: false});

module.exports = mongoConnections('master').model('Job', JobSchema);
