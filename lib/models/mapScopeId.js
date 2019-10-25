const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const _ = require('lodash')
const mongoConnections = require('../connections/mongo')

const MapScopeId = new mongoose.Schema({
  member: {
    type: Schema.Types.ObjectId
  },
  id: {
    type: String
  },
  createdAt: {
    type: Number,
    default: Date.now
  },
  updatedAt: {
    type: Number,
    default: Date.now
  }
}, {id: false, versionKey: false});

MapScopeId.index({member: 1});

module.exports = mongoConnections('master').model('MapScopeId', MapScopeId);
