const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const _ = require('lodash')
const mongoConnections = require('../connections/mongo')

var NotificationsSchema = new mongoose.Schema({
    platform : String,
    notify_token: String,
    member : {type: mongoose.Schema.Types.ObjectId, ref: 'Member'},
    createdAt: {
    	type: Number,
    	default: Date.now
    },
    updatedAt: {
    	type: Number
    }
}, {id: false, versionKey: 'v'});

NotificationsSchema.index({member: 1});
NotificationsSchema.index({platform: 1});

module.exports = mongoConnections('master').model('Notification', NotificationsSchema);
