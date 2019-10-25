const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const _ = require('lodash')
const mongoConnections = require('../connections/mongo')

const ShipperAuthentication = new mongoose.Schema({
  member: {
    type: Schema.Types.ObjectId
  },
  name: {
    type: String
  },
  licensePlate: {
    type: String
  },
  photo: {
    type: String
  },
  identityCard: {
    type: String
  },
  createdAt: {
    type: Number,
    default: Date.now
  }
}, {id: false, versionKey: false});

ShipperAuthentication.index({member: 1});

module.exports = mongoConnections('master').model('ShipperAuthentication', ShipperAuthentication);
