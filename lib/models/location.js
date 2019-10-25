const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const _ = require('lodash')
const mongoConnections = require('../connections/mongo')

const LocationSchema = new mongoose.Schema({
  member : {type: mongoose.Schema.Types.ObjectId, ref: 'Member'},
  location: { type: mongoose.Schema.Types.Mixed },
  bearing: {type: Number},
  speed: {type: Number},
  updatedAt: {
    type: Number,
    default: Date.now
  },
  sync: {
    type: Number,
    default: 0
  }
}, {id: false, versionKey: false});

LocationSchema.index({member: 1, updatedAt: 1})

module.exports = mongoConnections('master').model('Location', LocationSchema);
