const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const _ = require('lodash')
const mongoConnections = require('../connections/mongo')

const User = new mongoose.Schema({

}, {id: false, versionKey: false, strict: false});

module.exports = mongoConnections('master').model('User', User);
