const mongoose = require('mongoose');
const config = require('config');
const Schema = mongoose.Schema;
const _ = require('lodash')
const mongoConnections = require('../connections/mongo')

const Config = new mongoose.Schema({

}, {id: false, versionKey: false, strict: false});


Config.statics.get = function (query, fields, options, cb) {
  if(typeof options === 'function') {
    cb = options;
    options = {};
  }

  let func = this.findOne(query, fields, options).lean()

  if(config.enviroment === "production") {
    func = func.cache(300, `config:type:${query.type}`)
  }

  func.exec(cb);
}

module.exports = mongoConnections('master').model('Config', Config);
