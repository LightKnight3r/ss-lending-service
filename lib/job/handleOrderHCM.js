const _ = require('lodash');
const async = require('async');
const config = require('config');
const ms = require('ms');
const UtilHelper = require('../util/utils')
const shuffle = require('shuffle-array')
const jsonCompress = require('jsoncompress');
const CONSTANTS = require('../const');
const Member = require('../models/members')
const OrderSystem = require('../models/order-system')
const OrderTypeModel = require('../models/orderType')
const OrderLogModel = require('../models/orderLog')
const BlackShipperModel = require('../models/blackShipper')
const PushNotifyManager = require('./pushNotify');
const redisConnections = require('../connections/redis')
const PushSocketManager = require('./pushSocket');
const DispatchOrder = require('./dispatchOrder');
const memberHelper = require('../util/member');

const STATE = {
  PUSH_DIRECT: 0,
  PUSH_ORDER: 1,
  STOP: 2,
  HOLD_ORDER: 3
}

class HandleOrder {
  constructor(order, manager) {
    this.jobManager = manager;

    this.order = order;
    this.order.rejects = this.order.rejects || [];

    this.step = STATE.PUSH_DIRECT;

    this.shipperCanTake = null;
    this.timesSent = 0;
    this.sentError = 0;
    this.timesPush = 0;
    this.pushError = 0;
    this.hasAccept = false;
    this.currentTimeout = null;
    this.currentNext = null;
    this.currentShipper = null;

    this.preProcess();
  }

  preProcess() {
    const getOrderTypeInfo = (next) => {
      OrderTypeModel
        .findById(this.order.orderType)
        .lean()
        .exec((err, orderTypeInf) => {
          if(err || !orderTypeInf) {
            return next(err || `CAN_NOT_FIND_ORDER_TYPE_INFO`);
          }

          this.orderTypeInf = orderTypeInf;

          next();
        })
    }

    const getShopInf = (next) => {
      Member
        .findById(this.order.shop)
        .lean()
        .exec((err, shopInf) => {
          if(err || !shopInf) {
            return next(err || `CAN_NOT_FIND_SHOP_INF`);
          }

          if(this.order.ensure || shopInf.shop.isAuthen) {
            shopInf.shop.isAuthen = 1;
            shopInf.facebook.id = `sanshipHeyU`;
            shopInf.facebook.name = "Đơn hệ thống";
          }

          this.shopInf = shopInf;

          next();
        })
    }

    const getBlackShippers = (next) => {
      BlackShipperModel
        .findOne({
          member: this.order.shop
        })
        .lean()
        .exec((err, blackInfo) => {
          const users = [];
          if(!err && blackInfo) {
            blackInfo.blacks.forEach((black) => {
              users.push(black.member.toHexString());
            })
          }

          this.blacks = users;

          next();
        });
    }

    const getConfigProcessOrder = (next) => {
      this.configProcessOrder = this.getConfig();

      if(!this.configProcessOrder) {
        return next(`CANT_GET_CONFIG_PROCESS_ORDER`);
      }

      next();
    }

    async.parallel([
      getOrderTypeInfo,
      getShopInf,
      getBlackShippers,
      getConfigProcessOrder
    ], (err) => {
      if(!err) {
        return this.process();
      }

      if(err === `CAN_NOT_FIND_ORDER_TYPE_INFO` || err === `CAN_NOT_FIND_SHOP_INF` || err === `CANT_GET_CONFIG_PROCESS_ORDER`) {
        return this.sendOrderToCanNotFindShipperStatus();
      }

      if(err) {
        return setTimeout(() => {
          this.preProcess();
        }, 5000);
      }
    })
  }

  process() {
    logger.logInfo('Process order', this.order);

    if(this.isDone()) {
      return;
    }

    // if(this.shouldHoldOrder()) {
    //   return this.holdOrder();
    // }

    if(this.shouldSend()) {
      return this.sendToShipper();
    }

    if(this.shouldPush()) {
      return this.pushToOrder();
    }

    this.sendOrderToCanNotFindShipperStatus();
  }

  holdOrder() {
    this.step = STATE.HOLD_ORDER;
    this.timeoutHold = setTimeout(() => {
      if(!this.isDone()) {
        const message = "Rất tiếc hiện tại hệ thống không ghép cặp được Shipper nào cho đơn hàng này, có vẻ như phí Ship hơi thấp so với quãng đường. Bạn thử chỉnh sửa và tìm lại nhé. HeyU";
        this.sendOrderToCanNotFindShipperStatus(message);
      }
    }, ms('1m'));
  }

  shouldHoldOrder() {
    let shouldHold = false;

    if(this.order.salary < 20000
    || (this.order.distance*3000 > this.order.salary)) {
      shouldHold = true;
    }

    return shouldHold;
  }

  sendToShipper() {
    logger.logInfo('Send To Shipper');
    const self = this;
    let shippers;

    const getShippers = (next) => {
      const totalFee = this.order.serviceCharge + this.order.salaryStrategy.VAT;

      const location = {
        lat: this.order.origin_place.coordinates[1],
        lng:this.order.origin_place.coordinates[0]
      }
      const currentTime = Date.now();

      const query = {
        'ship.rateStar': {
          $gt: 3
        },
        updatedAt: {
          $gt: currentTime - ms(this.configProcessOrder.process.timeBefore)
        },
        blockOrderUtil: {
          $lt: currentTime
        }
      }

      if(this.order.rejects.length || this.blacks.length) {
        query._id = {
          $nin: this.order.rejects.concat(this.blacks)
        }
      }

      const options = {
        limit: 6
      }

      const fields = '_id facebook.name location'

      Member.getNearest(location, this.configProcessOrder.process.distance, query, fields, options, (err, results) => {
        logger.logInfo(err, results);

        if(err) {
          return next(err)
        }

        shippers = results;

        next();
      })
    }

    const getNumberOrders = (next) => {
      const timeTakeToNow = this.configProcessOrder.maximumTake.time;

      async.mapLimit(shippers, 3, (shipper, done) => {
        shipper.count = 0;
        OrderSystem.count({
          shipper: shipper._id,
          acceptedAt: {
            $gte: Date.now() - ms(timeTakeToNow)
          },
          $or: [{
            status: CONSTANTS.ORDER_STATUS.FOUND_SHIPPER
          }, {
            status: CONSTANTS.ORDER_STATUS.SHIPPING
          }]
        }, done)
      }, (err, results) => {
        if(err) {
          return next(null);
        }

        shippers.forEach((shipper, index) => {
          shipper.count = results[index];
        });

        // Remove shippers has order >= maximumTake
        const maximumTake = this.configProcessOrder.maximumTake.count;

        for(let i = 0; i < shippers.length; i++) {
          if(shippers[i].count >= maximumTake) {
            shippers.splice(i, 1);
            i--;
          }
        }

        shippers.sort((a, b) => {
          if(a.count <= b.count) {
            return -1;
          }

          return 1;
        });

        next(null);
      });
    }

    const checkAndSent = (next) => {
      let id;
      let name;

      async.eachSeries(shippers, (shipper, done) => {
        const idStringUser = shipper._id.toHexString();
        if(self.jobManager.isUserReceivingPush(idStringUser)) {
          return done();
        }

        PushSocketManager.pushToMember(idStringUser, "new_push_order", {
          data: {
            extras: {
              id: self.order._id.toHexString()
            }
          }
        }).then((resultPush) => {
          if(resultPush.code === CONSTANTS.CODE.SUCCESS) {
            this.currentShipper = shipper;
            id = idStringUser;
            name = shipper.facebook.name;

            self.shipperCanTake = id;
            this.jobManager.addUserReceivingPush(id);
            PushNotifyManager.sendViaSocket(self.order.shop.toHexString(), 'current_shipper', {step: this.step, data: this.currentShipper, name, id: self.order._id.toHexString()});

            return done('PUSHED');
          }

          done();
        })
        .catch((err) => {
          done();
        })
      }, (err) => {
        if(!id) {
          return next(`No shippers available`);
        }

        this.currentNext = next;
        this.currentTimeout = setTimeout(() => {
          this.handleAfterTimeoutPush(next);
        }, ms(this.configProcessOrder.process.timeWaitResponse));
      })
    }

    async.series([
      getShippers,
      getNumberOrders,
      checkAndSent
    ], (err) => {
      logger.logInfo(err);
      if(err && _.isError(err) && self.sentError <= self.configProcessOrder.process.retrySent) {
        self.sentError++;
      } else {
        self.increateTimesSent();
      }

      self.scheduleNextHandle();
    });
  }

  handleAfterTimeoutPush(next) {
    const shipperId = this.shipperCanTake;
    next = next || this.currentNext;
    this.jobManager.removeUserReceivingPush(shipperId);
    // reset state
    this.currentNext = null;
    this.currentShipper = null;
    this.currentTimeout = null;
    this.shipperCanTake = null;

    if(this.isDone()) {
      return next();
    }

    this.order.rejects.push(shipperId);
    next();
  }

  rejectPushOrder(userId) {
    if(userId === this.shipperCanTake) {
      // Do st in here
      clearTimeout(this.currentTimeout);
      this.handleAfterTimeoutPush();
    }
  }

  pushToOrder() {
    PushNotifyManager.sendViaSocket(this.order.shop.toHexString(), 'current_shipper', {step: this.step, data: null, name: `Chuyển đơn hàng lên toàn hệ thống`, id: this.order._id.toHexString()});

    let userInf;
    let orderTypeInf;

    const getOrderTypeInfo = (next) => {
      orderTypeInf = this.orderTypeInf;

      next();
    }

    const getUserInf = (next) => {
      userInf = this.shopInf;

      next();
    }

    const pubToRedis = (next) => {
      let message = `Từ: ${this.order.origin_place.name}`;
      this.order.destination_places.forEach((destination, index) => {
        if(index === 0) {
          message += `\r\nĐi: - ${destination.name}`
        } else {
          message += `\r\n     - ${destination.name}`
        }
      });
      message += `\r\nỨng: ${this.order.deposit.toLocaleString().replace(/,/g, ".")}₫\r\nShip: ${(this.order.salaryStrategy.direct + this.order.salaryStrategy.pay + this.order.salaryStrategy.tip + this.order.salaryStrategy.CODFee + this.order.salaryStrategy.VAT).toLocaleString().replace(/,/g, ".")}₫ ${this.order.salaryStrategy.priceIncrease >= 1.1 ? `(${this.order.salaryStrategy.priceIncrease}x)` : ''}`;

      if(this.order.distance) {
        message += `\r\nKhoảng cách giao hàng: ${this.order.distance}km`
      }

      if(this.order.note) {
        message += `\r\nNote: ${UtilHelper.replacePhone(this.order.note)}`;
      }

      message += `\r\nLoại đơn hàng: ${orderTypeInf.name}`

      let type = -1;
      if(_.get(userInf, 'shop.isAuthen', 0)) {
        type = 1;
      } else if(_.get(userInf, 'ship.isAuthen', 0)) {
        type = 2;
      }

      const obj = {
        id: this.order._id.toHexString(),
        message,
        full_picture: this.order.images && this.order.images.length ? this.order.images[0] : "",
        deposit: this.order.deposit/1000,
        salary: (this.order.salaryStrategy.direct + this.order.salaryStrategy.pay + this.order.salaryStrategy.tip + this.order.salaryStrategy.CODFee + this.order.salaryStrategy.VAT)/1000,
        from: {
         name: userInf.facebook.name,
         id: userInf.facebook.id,
         totalPost: _.get(userInf, 'shop.totalPostOS', 1)
        },
        location: {
          lat: this.order.origin_place.coordinates[1],
          lng: this.order.origin_place.coordinates[0]
        },
        created_time: new Date().toISOString(),
        isOpen: 0,
        type: type
      }

      if(this.order.ensure) {
        obj.from.totalPost = 1;
      }

      redisConnections('master')
        .getConnection()
        .publish('newFeedsHCM', JSON.stringify([JSON.stringify(jsonCompress.compress(obj, templateWhole))]), next)

      if(this.timesPush === 0) {
        redisConnections('master')
          .getConnection()
          .lpush('feedsFacebookHCM', [JSON.stringify(obj)], (err, res) => {
            if(err) {
              // globalVariables.get('logger').logError('redis:lpush', err);
              // return sendMail(err)
            }
            // console.log(`redis:lpush`, err, res);
          });
      }
    }

    async.waterfall([
      getOrderTypeInfo,
      getUserInf,
      pubToRedis
    ], (err, result) => {
      logger.logInfo(err, result);

      if(this.timesPush === 0) {
        this.pushNewOrderToSocket();
        this.pushNotifyToShippers();
        this.pushAll();
      }

      if(err && this.pushError <= this.configProcessOrder.process.retryPush) {
        this.pushError++;
      } else {
        this.increateTimesPush();
      }

      this.scheduleNextHandle();
    })
  }

  pushNotifyToShippers() {
    if(this.step === STATE.STOP) {
      return;
    }

    const self = this;
    const totalFee = this.order.serviceCharge + this.order.salaryStrategy.VAT;

    const location = {
      lat: this.order.origin_place.coordinates[1],
      lng:this.order.origin_place.coordinates[0]
    }

    const currentTime = Date.now();

    const query = {
      'ship.rateStar': {
        $gt: 3
      },
      updatedAt: {
        $gt: currentTime - ms('1m')
      },
      blockOrderUtil: {
        $lt: currentTime
      }
    }

    const options = {
      limit: 5
    }

    if(self.order.rejects.length || self.blacks.length) {
      query._id = {
        $nin: self.order.rejects.concat(self.blacks)
      }
    }

    const fields = '_id'

    Member.getNearest(location, 1000, query, fields, options, (err, results) => {
      if(!err && results.length) {
        let message = `${self.order.origin_place.name.split(",", 2).join(",")} -> ${self.order.destination_places[0].name.split(",", 2).join(",")}.`
        if(self.order.ensure) {
          message += ` Đơn hàng đảm bảo.`
        }
        message += ` Nhấp vào đây để xem đơn.`;

        results.forEach((shipper) => {
          if(!this.jobManager.isUserReceivingPush(shipper._id.toHexString())) {
            PushNotifyManager
              .sendToMember(shipper._id.toHexString(), 'Đơn hàng mới', message, {link: 'NewOrderPopup', extras:{id: this.order._id.toHexString()}}, "new_push_order")
              .then((result) => {
              })
              .catch((err) => {
              })
          }
        });
      }
    });
  }

  pushNewOrderToSocket() {
    if(this.step === STATE.STOP) {
      return;
    }

    let orderTypeInf;
    let userInf;

    const getOrderTypeInfo = (next) => {
      orderTypeInf = this.orderTypeInf;

      next();
    }

    const getShopInf = (next) => {
      userInf = this.shopInf;

      next();
    }

    const pushToSocket = (next) => {
      const objPush = {
        _id: this.order._id,
        id: this.order._id,
        orderType: {
          icon: orderTypeInf.icon,
          name: orderTypeInf.name
        },
        origin_place: this.order.origin_place,
        destination_places: this.order.destination_places,
        shop: {
          _id: userInf._id,
          facebook: {
            id: userInf.facebook.id,
            picture: userInf.facebook.picture,
            name: this.order.ensure ? "" : userInf.facebook.name
          },
          shop: userInf.shop,
          ship: userInf.ship
        },
        deposit: this.order.deposit,
        salary: this.order.salary,
        ensure: this.order.ensure,
        salaryStrategy: this.order.salaryStrategy,
        distance: this.order.distance,
        note: UtilHelper.replacePhone(this.order.note),
        tip: this.order.tip,
        createdAt: this.order.createdAt,
        updatedAt: this.order.createdAt
      }

      if(this.order.ensure) {
        objPush.shop.shop.totalPostOS = 1;
      }

      PushSocketManager.pushAll({eventName: 'new_order', region: this.order.region, data: objPush});

      next(null, {
        code: 200
      });
    }

    async.waterfall([
      getOrderTypeInfo,
      getShopInf,
      pushToSocket
    ], (err, result) => {

    });
  }

  pushAll() {
    const currentDate = new Date();

    if(currentDate.getHours() >= 0 && currentDate.getHours() < 6) {
      return;
    }

    // Handle push all
    let message = `Từ: ${this.order.origin_place.name}`;
    this.order.destination_places.forEach((destination, index) => {
      if(index === 0) {
        message += ` Đi: ${destination.name}`
      } else {
        message += `, ${destination.name}`
      }
    });
    message += ` Ứng: ${this.order.deposit.toLocaleString().replace(/,/g, ".")}₫ Ship: ${this.order.salary.toLocaleString().replace(/,/g, ".")}₫`;

    if(this.order.note) {
      message += `, Ghi chú: ${this.order.note}`;
    }

    message += ', Nhấp vào đây để nhận đơn hàng.';

    PushNotifyManager
      .sendAllToHCM("Đơn hàng mới", message, {link: 'NewOrderPopup', extras:{id: this.order._id.toHexString()}})
      .then((result) => {
      })
      .catch((err) => {
      })
  }

  sendOrderToCanNotFindShipperStatus(message) {
    logger.logInfo('sendOrderToCanNotFindShipperStatus');
    const self = this;

    PushSocketManager.pushAll({eventName: 'order_done', region: this.order.region, data: {id: this.order._id}});
    // Update status
    OrderSystem
      .update({
        _id: this.order._id,
        status: CONSTANTS.ORDER_STATUS.LOOKING_SHIPPER
      }, {
        rejects: this.order.rejects,
        status: CONSTANTS.ORDER_STATUS.CAN_NOT_FIND_SHIPPER
      })
      .exec((err, result) => {
        if(err) {
          return self.scheduleNextHandle();
        }

        self.setDone();

        DispatchOrder.dispatch(this.order._id.toHexString(), DispatchOrder.ORDER_TYPE.CAN_NOT_FIND_SHIPPER, (err, result) => {
        });

        OrderLogModel.logOrder({
          member: "594e082d885ac733cdb9fa26",
          shop: this.order.shop,
          shipper: null
        }, this.order._id, CONSTANTS.ORDER_LOG.FAIL);

        PushNotifyManager
          .sendToMember(self.order.shop.toHexString(), "Rất tiếc", message ? message : "Hiện tại hệ thống không ghép cặp được Shipper nào cho bạn vui lòng thử lại sau", {link: 'OrderCreatedScreen', extras:{id: self.order._id.toHexString()}}, 'order_update')
          .then((result) => {
            logger.logInfo('Push when fail', result);
          })
          .catch((err) => {
          })

        // handle back deposit if needed
        memberHelper.handleBackDeposit({
          userId: this.order.shop,
          orderId: this.order._id,
          deposit: this.order.salaryStrategy.inapp,
          region: this.order.region
        })
      })
  }

  getStep() {
    return this.step;
  }

  setDone() {
    this.hasAccept = true;

    if(this.currentTimeout) {
      clearTimeout(this.currentTimeout);
      this.handleAfterTimeoutPush();
    }

    if(this.timeoutHold) {
      clearTimeout(this.timeoutHold);
    }

    this.step = STATE.STOP;

    OrderSystem
      .update({
        _id: this.order._id
      }, {
        rejects: this.order.rejects
      })
      .exec();
  }

  isDone() {
    return this.hasAccept;
  }

  shouldSend() {
    return (this.timesSent < this.configProcessOrder.process.timesSent)
  }

  shouldPush() {
    const shoud = this.timesPush < this.configProcessOrder.process.timesPush;
    if(shoud && this.step !== STATE.PUSH_ORDER) {
      this.step = STATE.PUSH_ORDER;
    }

    return shoud;
  }

  increateTimesSent() {
    this.timesSent++;
    this.sentError = 0;
  }

  increateTimesPush() {
    this.timesPush++;
    this.pushError = 0;
  }

  scheduleNextHandle() {
    let time = 0;
    if(this.step === STATE.PUSH_DIRECT) {
      time = ms(this.configProcessOrder.process.distanceTimeDirect);
    } else if(this.step === STATE.PUSH_ORDER) {
      time = ms(this.configProcessOrder.process.distanceTimeOrder);
    }

    setTimeout(() => {
      this.process();
    }, time);
  }

  getShipperCanTake() {
    return this.shipperCanTake;
  }

  isCanTake(uid) {
    if(this.isDone()) {
      return false;
    } else if(this.step === STATE.PUSH_DIRECT) {
      return this.shipperCanTake === uid;
    } else if(this.step === STATE.PUSH_ORDER && this.blacks.indexOf(uid) === -1) {
      return true;
    }

    return false;
  }

  getOrderInf() {
    return this.order;
  }

  getOrderType() {
    return this.orderTypeInf;
  }

  getShopInf() {
    return this.shopInf;
  }

  getRegion() {
    return this.order.region;
  }

  ensure() {
    if(!this.order.ensure) {
      this.order.ensure = 1;
      if(this.shopInf && this.shopInf.shop) {
        this.shopInf.shop.isAuthen = 1;
        this.shopInf.facebook.id = `sanshipHeyU`;
        this.shopInf.facebook.name = "Đơn hệ thống";
      }
    }
  }

  getConfig() {
    return this.jobManager.getConfig(this.order.region)
  }

  getCurrentState() {
    return {
      step: this.step,
      data: this.currentShipper
    }
  }
}

const templateWhole = {
  "message": "",
  "from": {
      "name": "",
      "id": "",
      "totalPost": 1,
      "realId": ""
  },
  "created_time": "",
  "id": "",
  "location": {
      "lat": 0,
      "lng": 0
  },
  "full_picture": "",
  "phone": "",
  "salary": 0,
  "deposit": 0,
  "isOpen": 0,
  "type": 0
}

module.exports = HandleOrder;
