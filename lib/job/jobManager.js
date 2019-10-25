const _ = require('lodash');
const ms = require('ms');
const config = require('config');
const async = require('async');
const HandleOrder = require('./handleOrder');
const HandleOrderHCM = require('./handleOrderHCM');
const OrderSystem = require('../models/order-system')
const ConfigModel = require('../models/config');
const MemberModel = require('../models/members')
const BlackShipperModel = require('../models/blackShipper')
const CONSTANTS = require('../const');
const rp = require('request-promise');

class JobManager {
  constructor() {

    this.fnc = {};
    this.init();
  }

  init() {
    const configLink = {
      add: {
        uri: "/api/v1.0/order-process/add"
      },
      done: {
        uri: "/api/v1.0/order-process/done"
      },
      ensure: {
        uri: "/api/v1.0/order-process/ensure"
      },
      getConfig: {
        uri: "/api/v1.0/order-process/get-config"
      },
      getJobsByState: {
        uri: "/api/v1.0/order-process/get-orders-by-state"
      },
      getOrderInf: {
        uri: "/api/v1.0/order-process/get-order-inf"
      },
      getOrderState: {
        uri: "/api/v1.0/order-process/get-order-state"
      },
      rejectPushOrder: {
        uri: "/api/v1.0/order-process/reject-push-order"
      },
      report: {
        uri: "/api/v1.0/order-process/report"
      },
      take: {
        uri: "/api/v1.0/order-process/take"
      }
    }

    Object.keys(configLink).forEach((key) => {
      this.fnc[key] = (body) => {
        body = body || {};

        const options = {
          method: 'POST',
          uri: `${config.proxyRequestServer.serverOrderProcess}${configLink[key]['uri']}`,
          body: body,
          timeout: 10000,
          json: true // Automatically stringifies the body to JSON
        }

        return rp(options)
      }
    })
  }

  getConfig(region) {
    return this.fnc['getConfig']({
      region: region
    })
  }

  getJobByState(state, region) {
    return this.fnc['getJobsByState']({
      region: region,
      state: state
    })
  }

  add(id) {
    this.fnc['add']({
      orderId: id
    })
    .then((result) => {
      if(result.code === CONSTANTS.CODE.SYSTEM_ERROR) {
        setTimeout(() => {
          this.add(id);
        }, 5000);
      }
    })
    .catch((err) => {
      setTimeout(() => {
        this.add(id);
      }, 5000);
    })
  }

  getOrderInf(orderId) {
    return this.fnc['getOrderInf']({
      orderId: orderId
    })
  }

  getCurrentStateOrder(id) {
    return this.fnc['getOrderState']({
      orderId: id
    })
  }

  setDone(id) {
    return this.fnc['done']({
      orderId: id
    })
  }

  rejectPushOrder(userId, orderId) {
    return this.fnc['rejectPushOrder']({
      userId: userId,
      orderId: orderId
    })
  }

  ensureOrder(orderId) {
    return this.fnc['ensure']({
      orderId: orderId
    })
  }

  take(orderId, userId) {
    return this.fnc['take']({
      orderId: orderId,
      userId: userId
    })
  }

  report() {
    return this.fnc['report']()
  }
}

module.exports = new JobManager;
