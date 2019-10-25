const _ = require('lodash');
const async = require('async');
const StringeeLog = require('../models/stringeeLog')
const OrderSystem = require('../models/order-system')
const ConfigModel = require('../models/config')

module.exports = {

  getStringeePhone: (order, cb) => {

    let stringeePhone, customerPhone, memberPhone, member, stringeePhones;
    let hasStringeePhone = false;

    const getConfigStringee = (next) => {
      ConfigModel
        .findOne({type:5, status:1})
        .lean()
        .exec((err, result) => {
          if(err || !result || !result.config || !result.config.phones || result.config.phones.length === 0) {
            return next(err || 'error cannot find config stringee')
          }
          stringeePhones = result.config && result.config.phones ? result.config.phones : [];
          next();
        })
    }

    const findInfo = (next) => {

      OrderSystem.findOne({_id: order})
      .populate('shipper', 'phone')
      .select('shipper phone destination_places merchantInf')
      .lean()
      .exec((err, result) => {
        if(err || !result.shipper
          || !result.shipper.phone || !result.phone
        ) {
          return next(err || 'error order cannot found');
        }

        memberPhone = result.shipper.phone;

        // config tạm thời cho vay mượn
        if(result.destination_places[0] && result.destination_places[0].receiver.phone && result.destination_places[0].receiver.phone !== '0963492296') {
          customerPhone = result.destination_places[0].receiver.phone;
        }

        if(result.phone !== '0963492296') {
          customerPhone = result.phone;
        }

        // if(result.merchantInf.return) {
        //   if(result.destination_places[0] && result.destination_places[0].receiver && result.destination_places[0].receiver.phone) {
        //     customerPhone = result.destination_places[0].receiver.phone
        //   }
        // } else {
        //   customerPhone = result.phone;
        // }
        member = result.shipper._id;
        next();
      })
    }

    const checkCanCreate = (next) => {
      StringeeLog.findOne({
        memberPhone,
        member,
        order
      })
      .lean()
      .exec((err, result) => {
        if(err) {
          return next(err);
        }
        if(!result) {
          return next();
        }
        stringeePhone = result.stringeePhone;
        hasStringeePhone = true;
        next();
      })
    }

    const findStringeePhone = (next) => {

      if(hasStringeePhone) {
        return next();
      }
      StringeeLog.find({
        memberPhone,
        member
      })
      .sort({createdAt: -1})
      .limit(stringeePhones.length)
      .select({ stringeePhone: 1})
      .lean()
      .exec((err, results) => {
        if(err) {
          return next(err);
        }
        if(results.length === 0) {
          stringeePhone = stringeePhones[Math.floor(Math.random() * stringeePhones.length)];
          return next();
        }
        let usedPhones = [];
        results.forEach((phone) => {
          usedPhones.push(phone.stringeePhone);
        })
        const diff = _.differenceWith(stringeePhones,usedPhones, _.isEqual);
        if(diff.length === 0) {
          stringeePhone = usedPhones[stringeePhones.length-1];
          return next();
        }
        stringeePhone = diff[diff.length-1];
        next();
      })
    }

    const createLogStringee = (next) => {

      if(hasStringeePhone) {
        return next();
      }
      StringeeLog
      .create({
        memberPhone,
        customerPhone,
        stringeePhone,
        order,
        member
      },(err,results) => {
        if(err) {
          return next(err);
        }
        next();
      })
    }

    async.waterfall([
      getConfigStringee,
      findInfo,
      checkCanCreate,
      findStringeePhone,
      createLogStringee
    ], (err, result) => {
      if(err) {
        return cb({err})
      }
      if(!stringeePhones.includes(stringeePhone)) {
        stringeePhone = stringeePhones[Math.floor(Math.random() * stringeePhones.length)];
      }
      cb({stringeePhone});
    })
  }
}
