const _ = require('lodash');
const ms = require('ms');
const async = require('async');
const HandleOrder = require('./handleOrder');
const HandleOrderHCM = require('./handleOrderHCM');
const OrderSystem = require('../models/order-system')
const ConfigModel = require('../models/config');
const MemberModel = require('../models/members')
const BlackShipperModel = require('../models/blackShipper')
const CONSTANTS = require('../const');

class OrderInteractionManager {
  constructor() {
    this.init();
  }

  init() {
    // Set default config
    this.config = {
      hn: {
        COD: {
          strategy: "fixed",
          step: [
            {
              from: 2000000,
              to: 2499999,
              value: 5000
            },
            {
              from: 2500000,
              to: 3000000,
              value: 10000
            }
          ]
        },
        VAT: {
          percent: 10
        },
        serviceChage: {
          strategy : {
            base : "salary"
          },
          min : 5,
          max : 10,
          decreaseStrategy : {
            deposit : {
              step : [
                {
                  from : 1000000,
                  to : 1999999,
                  value : 1
                }
              ]
            },
            numDes : {
              step : [
                {
                  from : 2,
                  to : 100,
                  value : 1
                }
              ]
            }
          },
          minMaxMoneyStrategy : {
            min : {
              minMoney : 0,
              step : [{
                distance : 0,
                money : 4000
              }],
              moreDesPrice : 0
            },
            max : {
              minMoney : 0,
              step : [{
                distance : 0,
                money : 5000
              }],
              moreDesPrice : 0
            }
          }
        }
      },
      hcm: {
        COD: {
          strategy: "fixed",
          step: [
            {
              from: 2000000,
              to: 2499999,
              value: 5000
            },
            {
              from: 2500000,
              to: 3000000,
              value: 10000
            }
          ]
        },
        VAT: {
          percent: 0
        },
        serviceChage: {
          strategy : {
            base : "salary"
          },
          min : 0,
          max : 0,
          decreaseStrategy : {
            deposit : {
              step : [
                {
                  from : 1000000,
                  to : 1999999,
                  value : 1
                }
              ]
            },
            numDes : {
              step : [
                {
                  from : 2,
                  to : 100,
                  value : 1
                }
              ]
            }
          },
          minMaxMoneyStrategy : {
            min : {
              minMoney : 0,
              step : [{
                distance : 0,
                money : 4000
              }],
              moreDesPrice : 0
            },
            max : {
              minMoney : 0,
              step : [{
                distance : 0,
                money : 5000
              }],
              moreDesPrice : 0
            }
          }
        }
      }
    }

    this.syncConfig();
    setInterval(() => {
      this.syncConfig();
    }, ms("5m"))
  }

  syncConfig() {
    ConfigModel
      .findOne({
        type: 4,
        status: 1
      })
      .lean()
      .exec((err, result) => {
        if(!err && result) {
          this.config = result.config;
        }
      })
  }

  getConfig(region) {
    return this.config[region];
  }
}

module.exports = new OrderInteractionManager
