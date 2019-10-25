const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const _ = require('lodash')
const mongoConnections = require('../connections/mongo')

const Feedback = new mongoose.Schema({
  member : {type: mongoose.Schema.Types.ObjectId, ref: 'Member'},
}, {id: false, versionKey: false, strict: false});

Feedback.virtual('jobs', {
  ref: 'Job',
  localField: '_id',
  foreignField: 'idSource',
  justOne: true
});

module.exports = mongoConnections('master').model('Feedback', Feedback);
