const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const _ = require('lodash')
const mongoConnections = require('../connections/mongo')

var Contact = new mongoose.Schema({
  member : {type: mongoose.Schema.Types.ObjectId, ref: 'Member'},

}, {id: false, versionKey: false})


module.exports = mongoConnections('master').model('Contact', Contact);
