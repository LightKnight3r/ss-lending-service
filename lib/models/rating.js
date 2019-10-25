const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const _ = require('lodash')
const mongoConnections = require('../connections/mongo')

var RatingSchema = new mongoose.Schema({
    rater : {
      type: Schema.Types.ObjectId,
      ref: 'Member'
    },
    rated: {
      type: Schema.Types.ObjectId,
      ref: 'Member'
    },
    order: {
      type: Schema.Types.ObjectId,
      ref: 'OrderSystem'
    },
    mark : {type: 'Number'},
    description: {type: String, default: ""},
    raterType: {type: 'Number'},
    status: {type: 'Number'},
    approved: {type: 'Number'},
    createdAt: { type: Number, default: Date.now }
}, {id: false, versionKey: false})

RatingSchema.index({order: 1, rater: 1}, {unique: true});

module.exports = mongoConnections('master').model('Rating', RatingSchema);
