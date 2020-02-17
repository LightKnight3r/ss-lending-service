const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const mongoConnections = require('../connections/mongo')

var NewFeeds = new mongoose.Schema({
  message: String,
      permalink_url: String,
      from: {
          name: String,
          id: String
      },
      created_time: String,
      id: String,
      phone: String,
      salary: Number,
      deposit: Number,
      origin_place : {
        address: String,
        geometry:[],
      },
      destination_place : {
          address: String,
          geometry:[],
      },
      isOpen: Boolean
})

NewFeeds.index({phone: 1});
NewFeeds.index({"from.id": 1});
NewFeeds.index({"from.realId": 1});
NewFeeds.index({created_time: 1});
module.exports = mongoConnections('master').model('NewFeeds', NewFeeds);
