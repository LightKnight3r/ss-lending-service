const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const _ = require('lodash')
const mongoConnections = require('../connections/mongo')

var MemberSchema = new mongoose.Schema({
    email : {type: String},
    password: {type: String},
    phone : {type: String},
    name: {type: String},
    address: {type: String},
    birthday: {
        day: { type: Number },
        month: { type: Number },
        year: {type : Number}
    },
    facebook: {
        id: {type: String,index:true,unique: true},
        realId: {type: String,index:true},
        name: {type: String},
        email: {type: String},
        birthday: {type: String},
        token: {type: String},
        locale: {type: String},
        timezone: {type: String},
        picture: {type: String}
    },
    status: {type: Number, default: 0},
    likes: {
      type: 'Number',
      default: 0
    },
    dislikes: {
      type: 'Number',
      default: 0
    },
    shop:{
      totalPost: {type: 'Number',default: 0},
      isAuthen: {
        type: 'Number',
        default: 0
      },
      totalPostOS: {type: 'Number', default: 0}
    },
    ship:{
      isAuthen: {
        type: 'Number',
        default: 0
      },
      totalRides: {
        type: 'Number',
        default: 0
      },
      totalRejects:{
        type: 'Number',
        default: 0
      },
      rateStar: {
        type: 'Number',
        default: 0
      }
    },
    coints: {
      type: 'Number',
      default: 0
    },
    realMoney: {
      type: 'Number',
      default: 0
    },
    deposit: {
      type: 'Number',
      default: 0
    },
    expireTime: {
      type: 'Number',
      default: 0
    },
    blockUtil: {
      type: 'Number',
      default: 0
    },
    blockOrderUtil: {
      type: 'Number',
      default: 0
    },
    receivePushOrder: {
      type: 'Number',
      default: 1
    },
    memberToken: {type: String},
    granted: Boolean,
    createdAt: { type: Number, default: Date.now },
    location: { type: mongoose.Schema.Types.Mixed },
    updatedAt: {type: Number, default: Date.now }
}, {id: false, versionKey: 'v'})

MemberSchema.virtual('mapScopeId', {
  ref: 'MapScopeId', // The model to use
  localField: '_id', // Find people where `localField`
  foreignField: 'member', // is equal to `foreignField`
  justOne: true
});

MemberSchema.statics.getNearest = function (location, distance, query, fields, options, cb) {
  distance = _.isFinite(distance) ? distance : 500

  this
    .find(query, fields, options)
    .near('location', {
      center: {
        coordinates: [location.lng, location.lat],
        type: 'Point'
      },
      maxDistance: distance
    })
    .lean()
    .exec(cb)
}

MemberSchema.statics.increaseTotalOrder = function (userId, cb) {
  this
    .update({_id: userId}, {
      $inc: {
        "shop.totalPostOS": 1
      }
    }).exec(cb)
}

MemberSchema.statics.increaseRealMoney = function (userId, money, cb) {
  this
    .findOneAndUpdate({_id: userId}, {
      $inc: {
        realMoney: money
      }
    }, {
      'new': true
    }).exec(cb)
}

MemberSchema.statics.decreaseCoint = function (userId, coints, cb) {
  this
    .findOneAndUpdate({_id: userId}, {
      $inc: {
        coints: -coints
      }
    }, {
      'new': true
    }).exec(cb)
}

MemberSchema.statics.increaseCoint = function (userId, coints, cb) {
  this
    .findOneAndUpdate({_id: userId}, {
      $inc: {
        coints: coints
      }
    }, {
      'new': true
    }).exec(cb)
}

MemberSchema.virtual('shipperauthentications', {
  ref: 'ShipperAuthentication',
  localField: '_id',
  foreignField: 'member'
});


module.exports = mongoConnections('master').model('Member', MemberSchema);
