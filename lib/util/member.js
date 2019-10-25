const _ = require('lodash');
const async = require('async');
const MemberModel = require('../models/members')
const TransactionLogModel = require('../models/transactionLog')

module.exports = {
  isShipper: (userInf) => {
    let value = false;

    if(userInf.coints > 0 || userInf.realMoney > 0 || userInf.training || userInf.ship.isAuthen
    || userInf.ship.totalRides > 0 || userInf.ship.totalRejects > 0 || userInf.blockOrderUtil > 0) {
      value = true;
    }

    return value;
  },
  phoneIsNotStartWith: (listPhoneCheck, listStartPhone) => {
    let value = false;

    for(let i=0; i<listPhoneCheck.length && !value; i++) {
      for(let j=0; j<listStartPhone.length; j++) {
        if(listPhoneCheck[i].startsWith(listStartPhone[j])) {
          value = true;
          break;
        }
      }
    }

    return value;
  },
  handleIncreaseBonus: (obj, cb) => {
    const userId = obj.userId;
    const orderId = obj.orderId;
    const bonus = obj.bonus;
    const region = obj.region;

    if(!cb) {
      cb = (err) => {
        if(err) {
          logger.logError(err)
        }
      }
    }

    if(!bonus) {
      return cb();
    }

    let memberInfo;
    const increaseSSMFollowBonus = (done) => {
      MemberModel
        .findOneAndUpdate({
          _id: userId
        }, {
          $inc: {
            realMoney: bonus
          }
        })
        .exec((err, result) => {
          if(err || !result) {
            return done(err || new Error(`Not found user inf`));
          }

          memberInfo = result;

          done();
        })
    }

    const writeLogTransaction = (done) => {
      TransactionLogModel
        .create({
          member: userId,
          region: region,
          message: "Cộng tiền SSM HeyU hỗ trợ",
          data: {
            amount: bonus,
            idOrder: orderId,
            type: 14,
            finalCoints: memberInfo.coints,
            initialCoints: memberInfo.coints,
            finalRealMoney: memberInfo.realMoney + bonus,
            initialRealMoney: memberInfo.realMoney
          }
        }, (err) => {
          done();
        })
    }

    async.waterfall([
      increaseSSMFollowBonus,
      writeLogTransaction
    ], cb)
  },
  handleBackDeposit: (obj, cb) => {
    const userId = obj.userId;
    const orderId = obj.orderId;
    const deposit = obj.deposit;
    const region = obj.region;

    if(!cb) {
      cb = (err) => {
        if(err) {
          logger.logError(err)
        }
      }
    }

    if(!deposit) {
      return cb();
    }

    let memberInfo;
    const increaseDeposit = (done) => {
      MemberModel
        .findOneAndUpdate({
          _id: userId
        }, {
          $inc: {
            deposit: deposit
          }
        })
        .exec((err, result) => {
          if(err || !result) {
            return done(err || new Error(`Not found user inf`));
          }

          memberInfo = result;

          done();
        })
    }

    const writeLogTransaction = (done) => {
      TransactionLogModel
        .create({
          member: userId,
          region: region,
          message: "Trả lại phí thanh toán đơn hàng",
          data: {
            amount: deposit,
            idOrder: orderId,
            type: 11,
            back: 1,
            finalCoints: memberInfo.coints,
            initialCoints: memberInfo.coints,
            finalRealMoney: memberInfo.realMoney,
            initialRealMoney: memberInfo.realMoney,
            initialDeposit: memberInfo.deposit,
            finalDeposit: memberInfo.deposit + deposit,
          }
        }, (err) => {
          done();
        })
    }

    async.waterfall([
      increaseDeposit,
      writeLogTransaction
    ], cb)
  },
  handleIncreaseRealMoneyViaInapp: (obj, cb) => {
    const userId = obj.userId;
    const orderId = obj.orderId;
    const amount = obj.amount;
    const region = obj.region;

    if(!cb) {
      cb = (err) => {
        if(err) {
          logger.logError(err)
        }
      }
    }

    if(!amount) {
      return cb();
    }

    let memberInfo;
    const increaseDeposit = (done) => {
      MemberModel
        .findOneAndUpdate({
          _id: userId
        }, {
          $inc: {
            realMoney: amount
          }
        })
        .exec((err, result) => {
          if(err || !result) {
            return done(err || new Error(`Not found user inf`));
          }

          memberInfo = result;

          done();
        })
    }

    const writeLogTransaction = (done) => {
      TransactionLogModel
        .create({
          member: userId,
          region: region,
          message: "Thanh toán qua ứng dụng",
          data: {
            amount: amount,
            idOrder: orderId,
            type: 12,
            finalCoints: memberInfo.coints,
            initialCoints: memberInfo.coints,
            finalRealMoney: memberInfo.realMoney + amount,
            initialRealMoney: memberInfo.realMoney
          }
        }, (err) => {
          done();
        })
    }

    async.waterfall([
      increaseDeposit,
      writeLogTransaction
    ], cb)
  }
}
