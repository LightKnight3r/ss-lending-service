const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const _ = require('lodash')
const mongoConnections = require('../connections/mongo')

const BlackShipperModel = new mongoose.Schema({
  member : {
    type: Schema.Types.ObjectId
  },
  blacks: [
    {
      _id: false,
      member: Schema.Types.ObjectId,
      message: String,
      createdAt: {
        type: Number,
        default: Date.now
      }
    }
  ],
  createdAt: {
    type: Number,
    default: Date.now
  }
}, {id: false, versionKey: false});

BlackShipperModel.index({member: 1});

module.exports = mongoConnections('master').model('BlackShipper', BlackShipperModel);
