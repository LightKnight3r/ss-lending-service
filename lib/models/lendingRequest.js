const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const _ = require('lodash')
const mongoConnections = require('../connections/mongo')

var LendingRequest = new mongoose.Schema({
    id : {
      type: String,
    },
    member: {
      type: Schema.Types.ObjectId,
      ref: 'Member'
    },
    status: {
      type: Number,
      default: 0
    },
    lendStatus: {
      type: String
    },
    result: {
      type: mongoose.Schema.Types.Mixed
    },
    type: {
      type: Number
    },
    approve: {
      type: mongoose.Schema.Types.Mixed
    },
    updatedAt: { type: Number, default: Date.now },
    createdAt: { type: Number, default: Date.now }
}, {id: false, versionKey: false})


module.exports = mongoConnections('master').model('LendingRequest', LendingRequest);
