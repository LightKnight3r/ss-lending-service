const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const _ = require('lodash')
const mongoConnections = require('../connections/mongo')

var LendingLog = new mongoose.Schema({
    lendId : {
      type: Schema.Types.ObjectId,
      ref: 'LendingProfile'
    },
    status: {
      type: String
    },
    results: {
      type: mongoose.Schema.Types.Mixed
    },
    createdAt: { type: Number, default: Date.now }
}, {id: false, versionKey: false})


module.exports = mongoConnections('master').model('LendingLog', LendingLog);
