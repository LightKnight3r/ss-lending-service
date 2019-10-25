const mongoose = require('mongoose');
const config = require('config');
const Schema = mongoose.Schema;
const _ = require('lodash')
const mongoConnections = require('../connections/mongo')

var OrderType = new mongoose.Schema({
  name: {
    type: String
  },
  message: {
    type: String
  },
  icon: {
    type: String
  },
  showTip: {
    type: Number
  },
  hideList: {
    type: Number
  },
  forceMoney: {
    type: Number
  },
  maxDeposit: {
    type: Number
  },
  depositEnsure: {
    type: Number
  },
  moneyStrategy: {
    type: Schema.Types.Mixed
  },
  forceAuthen: {
    type: Number
  },
  multipleDes: {
    type: Number
  },
  region: {
    type: Schema.Types.Mixed
  },
  order: {
    type: Number,
    default: 0
  },
  focus: {
    type: Number,
    default: 0
  },
  status: {
    type: Number
  }
}, {versionKey: false})

OrderType.statics.list = function (query, fields, options, cb) {
  if(typeof options === 'function') {
    cb = options;
    options = {};
  }

  query = query || {};
  query.status = 1;
  query.hideList = 0;
  options.sort = {
    order: 1
  }

  let func = this.find(query, fields, options).lean()

  if(config.enviroment === "production") {
    func = func.cache(300, `ordertype:list:${query.region}`)
  }

  func.exec(cb);
}

OrderType.statics.get = function (query, fields, options, cb) {
  if(typeof options === 'function') {
    cb = options;
    options = {};
  }

  let func = this.findOne(query, fields, options).lean()

  // if(config.enviroment === "production") {
  //   func = func.cache(300, `ordertype:get:${query._id}`)
  // }

  func.exec(cb);
}


module.exports = mongoConnections('master').model('OrderType', OrderType);
