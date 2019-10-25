const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const _ = require('lodash')
const mongoConnections = require('../connections/mongo')

var StatisticFeedFacebook = new mongoose.Schema({
    id: {type: 'String'},
    phone: {type: 'String'},
    count: {type: 'Number'}
}, {versionKey: false});

StatisticFeedFacebook.index({id: 1});
StatisticFeedFacebook.index({phone: 1});

module.exports = mongoConnections('master').model('StatisticFeedFacebook', StatisticFeedFacebook);
