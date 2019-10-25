const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const _ = require('lodash')
const mongoConnections = require('../connections/mongo')

const EnsureFutureModel = new mongoose.Schema({
  member : {type: mongoose.Schema.Types.ObjectId, ref: 'Member'},
  strategy: {
    type: Schema.Types.Mixed
  },
  supporter: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Number,
    default: Date.now
  }
}, {id: false, versionKey: false});

EnsureFutureModel.index({member: 1});

module.exports = mongoConnections('master').model('EnsureFuture', EnsureFutureModel);
