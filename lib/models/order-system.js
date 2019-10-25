const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const _ = require('lodash')
const mongoConnections = require('../connections/mongo')

var OrderSystem = new mongoose.Schema({
  shipper: {
    type: Schema.Types.ObjectId,
    ref: 'Member'
  },
  shop: {
    type: Schema.Types.ObjectId,
    ref: 'Member'
  },
  current_place: { type: mongoose.Schema.Types.Mixed },
  origin_place: { type: mongoose.Schema.Types.Mixed },
  destination_places: { type: mongoose.Schema.Types.Mixed },
  cart: {
    type: mongoose.Schema.Types.Mixed
  },
  deposit: {
    type: Number,
    default: 0
  },
  promote: {
    type: Schema.Types.ObjectId
  },
  salary: {
    type: Number,
    default: 0
  },
  salaryStrategy: {
    type: Schema.Types.Mixed
  },
  serviceCharge: {
    type: Number,
    default: 0
  },
  distance: {
    type: Number,
    default: 0
  },
  note: {
    type: String,
    default: ""
  },
  phone: {
    type: String,
    default: ""
  },
  region: {
    type: String,
    default: ""
  },
  status: {
    type: Number,
    default: 0
  },
  rejects: {
    type: [String],
    default: []
  },
  orderType: {
    type: Schema.Types.ObjectId,
    ref: 'OrderType'
  },
  tip: {
    type: Number,
    default: 0
  },
  takeOrderInf: {
    type: Schema.Types.Mixed
  },
  doneOrderInf: {
    type: Schema.Types.Mixed
  },
  cantTakeOrderInf: {
    type: Schema.Types.Mixed
  },
  startReturningOrderInf: {
    type: Schema.Types.Mixed
  },
  returnDoneOrderInf: {
    type: Schema.Types.Mixed
  },
  createdAt: {
    type: Number,
    default: Date.now
  },
  acceptedAt: {
    type: Number,
    default: Date.now
  },
  updatedAt: {
    type: Number,
    default: Date.now
  },
  hasCalled: {
    type: Number,
    default: 0
  },
  shopHasCalled: {
    type: Number,
    default: 0
  },
  hasMessage: {
    type: Number,
    default: 0
  },
  ensure: {
    type: Number,
    default: 0
  },
  shopHasMessage: {
    type: Number,
    default: 0
  },
  hideShipper: {
    type: Number,
    default: 0
  },
  needRating:{
    type: Number,
    default: 0
  },
  merchantInf:{
    type: Schema.Types.Mixed
  },
  images: {
    type: Schema.Types.Mixed
  }
}, {versionKey: false})

OrderSystem.index({status: 1});
OrderSystem.index({shipper: 1, acceptedAt: 1});
OrderSystem.index({shop: 1, updatedAt: 1});

OrderSystem.virtual('mapScopeId', {
  ref: 'MapScopeId', // The model to use
  localField: 'shop', // Find people where `localField`
  foreignField: 'member', // is equal to `foreignField`
  justOne: true
});

OrderSystem.virtual('ratings', {
  ref: 'Rating',
  localField: '_id',
  foreignField: 'order',
  justOne: true
});

module.exports = mongoConnections('master').model('OrderSystem', OrderSystem);
