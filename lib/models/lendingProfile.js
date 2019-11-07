const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const _ = require('lodash')
const mongoConnections = require('../connections/mongo')

var LendingProfile = new mongoose.Schema({
    member : {
      type: Schema.Types.ObjectId,
      ref: 'Member'
    },
    phone : {
      type: String
    },
    loan: {
      type: mongoose.Schema.Types.Mixed
    },
    loan_id: {
      type: Number
    },
    profile: {
      type: mongoose.Schema.Types.Mixed
    },
    results: {
      type: mongoose.Schema.Types.Mixed
    },
    status: {
      type: String
    },
    hasVideo:{
      type: Number, default: 0
    },
    createdAt: { type: Number, default: Date.now }
}, {id: false, versionKey: false})


module.exports = mongoConnections('master').model('LendingProfile', LendingProfile);
