const _ = require('lodash')
const config = require('config')
const async = require('async');
const util = require('util');
const OrderSystemModel = require('../models/order-system')
const TrackingActionModel = require('../models/trackingAction')
const TransactionLogModel = require('../models/transactionLog')
const PromoteLogModel = require('../models/promoteLog')
const MemberModel = require('../models/members')
const locationUtil = require("../util/location")
const PushNotify = require('./pushNotify');
const CONSTANTS = require('../const')

class PromoteManager {
  constructor() {
    this.queue = [];
    this.isProcessing = false;
  }

  add(idOrder) {
    this.queue.push(idOrder);
    if(!this.isProcessing) {
      this.isProcessing = true;
      this.process();
    }
  }

  process() {
    console.log('Process');
    if(!this.queue.length) {
      this.isProcessing = false;
      return;
    }

    const idOrder = this.queue.shift();

    let orderInf;
    let shopInf;
    let shipperInf;
    let shipperUpdatedInf;
    let message = '';

    const checkIsNotProcess = (next) => {
      PromoteLogModel
        .count({
          order: idOrder
        })
        .exec((err, count) => {
          if(err) {
            return next(err);
          }

          if(count > 0) {
            return next(`Đơn hàng đã được xử lý`);
          }

          next();
        })
    }

    const getOrderInf = (next) => {
      OrderSystemModel
        .findById(idOrder)
        .populate("shipper")
        .populate("shop")
        .lean()
        .exec((err, result) => {
          if(err) {
            return next(err);
          }

          if(!result) {
            return next('Not found order info.');
          }

          if(result.status === CONSTANTS.ORDER_STATUS.RETURN_DONE) {
            return next('Order back to Shop succeed. Need confirm with Shop.')
          }

          if(result.status !== CONSTANTS.ORDER_STATUS.DONE) {
            return next('Order not finish yet.');
          }

          if(!result.shop || !result.shipper) {
            return next('Shipper or Shop not exists.');
          }

          orderInf = result;
          shipperInf = result.shipper;
          shopInf = result.shop;

          next();
        })
    }

    const checkCondition = (next) => {
      // Check same account
      const checkSameAccount = (done) => {
        if(shopInf._id.toHexString() === shipperInf._id.toHexString()) {
          message += 'Shipper và Shop là 1 tài khoản.\n'
        }

        done();
      }

      // Check device
      const checkDevice = (done) => {
        const getDeviceShipper = (cb) => {
          TrackingActionModel
            .find({
              member: shipperInf._id
            })
            .lean()
            .exec(cb);
        }

        const getDeviceShop = (cb) => {
          TrackingActionModel
            .find({
              member: shopInf._id
            })
            .lean()
            .exec(cb);
        }

        async.parallel([
          getDeviceShipper,
          getDeviceShop
        ], (err, results) => {
          if(err) {
            return done(err);
          }

          const deviceIdShop = [];
          const deviceIdShipper = [];
          const deviceDuplicate = [];

          results[0].forEach((trackingInfo) => {
            const deviceId = _.get(trackingInfo, 'otherInf.uniqueId', '');
            if(deviceId && deviceIdShipper.indexOf(deviceId) === -1) {
              deviceIdShipper.push(deviceId);
            }
          })

          results[1].forEach((trackingInfo) => {
            const deviceId = _.get(trackingInfo, 'otherInf.uniqueId', '');
            if(deviceId && deviceIdShop.indexOf(deviceId) === -1) {
              deviceIdShop.push(deviceId);
            }
          })

          deviceIdShipper.forEach((deviceId) => {
            if(deviceIdShop.indexOf(deviceId) !== -1) {
              deviceDuplicate.push(deviceId);
            }
          })

          if(deviceDuplicate.length) {
            message += `Shipper và Shop đã từng đăng nhập trên cùng thiết bị.\n`
          }

          done();
        })
      }

      const checkTakeOrder = (done) => {
        if(!orderInf.takeOrderInf || !orderInf.takeOrderInf.location) {
          message += 'Thiếu thông tin cập nhật tới vị trí lấy hàng.\n';
          return done();
        }

        const timeTake = orderInf.takeOrderInf.time;
        const locationTakeShipper = orderInf.takeOrderInf.location;
        const locationTakeShop = orderInf.origin_place;

        let distanceTake = 0;
        if(locationTakeShipper) {
          distanceTake = locationUtil.getDistanceFromLatLonInKm(locationTakeShipper.coordinates[1], locationTakeShipper.coordinates[0], locationTakeShop.coordinates[1], locationTakeShop.coordinates[0]);
        }

        if(distanceTake >= 1) {
          message += `Vị trí lấy hàng chênh lệch ${distanceTake} km.\n`;
        }

        done();
      }

      const checkDoneOrder = (done) => {
        if(!orderInf.doneOrderInf || !orderInf.doneOrderInf.location) {
          message += 'Thiếu thông tin cập nhật giao hàng.\n';
          return done();
        }

        const timeDone = orderInf.doneOrderInf.time;
        const locationDoneShipper = orderInf.doneOrderInf.location;
        const locationDoneShop = orderInf.destination_places[0];

        let distanceDone = 0;
        if(locationDoneShipper) {
          distanceDone = locationUtil.getDistanceFromLatLonInKm(locationDoneShipper.coordinates[1], locationDoneShipper.coordinates[0], locationDoneShop.coordinates[1], locationDoneShop.coordinates[0]);
        }

        if(distanceDone >= 1) {
          message += `Vị trí giao hàng chênh lệch ${distanceDone} km.\n`;
        }

        done();
      }

      const checkTimeDelivery = (done) => {
        let totalTime;
        if(orderInf.takeOrderInf && orderInf.doneOrderInf) {
          totalTime = orderInf.doneOrderInf.time - orderInf.takeOrderInf.time;

          if(orderInf.distance*2.5*60*1000 >= totalTime) {
            let minutes = Math.round(totalTime/100/60)/10;
            message += `Giao hàng quá nhanh ${orderInf.distance} km trong ${minutes} phút.\n`;
          }
        }

        done();
      }

      async.waterfall([
        checkSameAccount,
        checkDevice,
        checkTakeOrder,
        checkDoneOrder,
        checkTimeDelivery
      ], (err) => {
        if(err) {
          return next(err);
        }

        next();
      })
    }

    const increaseRealMoneyAndLogTransaction = (next) => {
      if(message) {
        return next();
      }

      MemberModel
        .increaseRealMoney(shipperInf._id, orderInf.salaryStrategy.pay, (err, data) => {
          if(err || !data) {
            return next(err || new Error(`increaseRealMoney for shipper fail`));
          }

          shipperUpdatedInf = data;

          TransactionLogModel
            .create({
              member: shipperInf._id,
              region: orderInf.region,
              data: {
                type: 6,
                amount: orderInf.salaryStrategy.pay,
                idOrder: idOrder,
                finalRealMoney: data.realMoney,
                initialRealMoney: data.realMoney - orderInf.salaryStrategy.pay,
                initialCoints: data.coints,
                finalCoints: data.coints
              },
              message: "Cộng tiền SSM đơn hàng trợ giá"
            }, (err, data) => {
            })

          next();
        });
    }

    async.waterfall([
      checkIsNotProcess,
      getOrderInf,
      checkCondition,
      increaseRealMoneyAndLogTransaction
    ], (err) => {
      PromoteLogModel
        .create({
          order: idOrder,
          shipper: orderInf ? orderInf.shipper : null,
          shop: orderInf ? orderInf.shop : null,
          promote: orderInf ? orderInf.promote : null,
          status: (err || message) ? -1 : 1,
          message: message,
          region: orderInf ? orderInf.region : '',
          error: util.inspect(err)
        }, () => {
          this.process();
        })
    });
  }
}

module.exports = new PromoteManager
