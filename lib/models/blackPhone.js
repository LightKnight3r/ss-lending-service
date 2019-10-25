const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const _ = require('lodash')
const mongoConnections = require('../connections/mongo')

const BlackPhoneSchema = new mongoose.Schema({
  phone : {
    type: String
  }
}, {id: false, versionKey: false});

module.exports = mongoConnections('master').model('BlackPhone', BlackPhoneSchema);
