const async = require('async');
const UtilHelper = require('./utils');
const config = require('config');
const OrderInteractionManager = require('../job/orderInteractionManager');
const EnsureFutureModel = require('../models/ensureFuture')
const OrderSystemModel = require('../models/order-system')

module.exports = {
  checkCanBeEnsure: (userInf, orderInf, cb) => {
    let ensure = 0;

    let ensureInf, countEnsure;
    const getEnsureInf = (next) => {

      EnsureFutureModel
        .findOne({
          member: userInf._id
        })
        .lean()
        .exec((err, result) => {
          if(err || !result) {
            return next(err || `Not exists ensure strategy`);
          }

          ensureInf = result;

          next();
        })
    }

    const getHistoryEnsure = (next) => {
      OrderSystemModel
        .count({
          shop: userInf._id,
          ensure: 1,
          status: {
            $in: [0, 1, 2 ,3]
          }
        })
        .lean()
        .exec((err, count) => {
          if(err) {
            return next(err);
          }

          countEnsure = count;

          next();
        })
    }

    const checkCanBeEnsure = (next) => {
      const strategy = ensureInf.strategy;

      if(countEnsure < strategy.count
      && (!strategy.time || UtilHelper.checkFieldRange(Date.now(), strategy.time))
      && (!strategy.deposit || UtilHelper.checkFieldRange(orderInf.deposit, strategy.deposit))) {
        ensure = 1;
      }

      next();
    }

    async.waterfall([
      getEnsureInf,
      getHistoryEnsure,
      checkCanBeEnsure
    ], (err, data) => {
      cb(null, ensure);
    })
  },
  calculateVATFeeFromFinalCash: (finalCash, region) => {
    const obj = {
      salary: finalCash,
      VAT: 0
    }

    if(region === 'hn') {
      obj.salary = Math.ceil(finalCash/1.1/1000)*1000;
      obj.VAT = finalCash - obj.salary
    }

    return obj;
  },
  calculateVATFeeFromFinalCash_v2: (finalCash, region) => {
    const configVAT = OrderInteractionManager.getConfig(region).VAT;
    const percentVAT = configVAT.percent;

    const obj = {
      salary: finalCash,
      VAT: 0
    }

    if(region === 'hn') {
      obj.salary = Math.ceil(finalCash/(1 + percentVAT/100));
      obj.VAT = finalCash - obj.salary
    }

    return obj;
  },
  calculateVATFee: (salary, region) => {
    let VATFee, totalFeeCash, diff;
    const percentVAT = config.order.VAT[region] || 0;

    if(salary < 10000) {
      salary = salary + (10000 - Math.floor(salary))
    }

    VATFee = Math.round(percentVAT*salary/100);
    totalFeeCash = salary + VATFee;
    diff = totalFeeCash/1000 - Math.floor(totalFeeCash/1000);

    if(diff > 0) {
      VATFee = Math.round(VATFee - diff*1000);
    }

    if(VATFee < 0) {
      VATFee = 0;
    }

    return VATFee;
  },
  calculateCODFee: (deposit, region) => {
    let CODFee = 0;

    if(!OrderInteractionManager.getConfig(region)) {
      return CODFee;
    }

    const configCOD = OrderInteractionManager.getConfig(region).COD;


    if(configCOD.strategy === 'fixed') {
      const step = configCOD.step;

      for(let i=0; i<step.length; i++) {
        if(deposit >= step[i].from && deposit <= step[i].to) {
          CODFee = step[i].value;
          break;
        }
      }
    } else if(configCOD.strategy = 'percent') {
      const step = configCOD.step;

      for(let i=0; i<step.length; i++) {
        if(deposit >= step[i].from && deposit <= step[i].to) {
          CODFee = deposit*step[i].value;
          CODFee = Math.round(CODFee/1000)*1000;

          break;
        }
      }
    }

    return CODFee;
  },
  calculateMoney: (distance, moneyStrategy, priceIncrease, numDes) => {
    const configMoney = moneyStrategy.step || [];
    const min = moneyStrategy.minMoney;
    const moreDesPrice = moneyStrategy.moreDesPrice || 0;

    priceIncrease = priceIncrease || 1;
    numDes = numDes || 1;

    let money = 0;
    for(let i=0; i<configMoney.length; i++) {
      if (configMoney[i].distance === 0) {
        money += configMoney[i].money*distance;
        break;
      } else if (distance >= configMoney[i].distance) {
        distance -= configMoney[i].distance
        money += configMoney[i].money*configMoney[i].distance
      } else {
        money += configMoney[i].money*distance;
        break;
      }
    }

    if(money < min) {
      money = min;
    }

    if(numDes > 1) {
      money += moreDesPrice*(numDes - 1);
    }

    money = money*priceIncrease;

    money = Math.round(money/1000)*1000;

    return money;
  },
  determineRegionOrder(originLocation) {
    const centerLocationHN = {
      lat: 21.0274906,
      lng: 105.8324145
    };
    const centerLocationHCM = {
      lat: 10.8209793,
      lng: 106.6088409
    };

    let region = 'hn';

    const distanceFromCenterHN = UtilHelper.calculateDistance(originLocation.lat, originLocation.lng, centerLocationHN.lat, centerLocationHN.lng);
    const distanceFromCenterHCM = UtilHelper.calculateDistance(originLocation.lat, originLocation.lng, centerLocationHCM.lat, centerLocationHCM.lng);
    if(distanceFromCenterHN > distanceFromCenterHCM) {
      region = 'hcm';
    }

    return region;
  },
  calculateServiceCharge(distance, money) {
    let serviceCharge = 0;
    let percent;

    const minMoney = calculateMinMoney(distance);
    const maxMoney = calculateMaxMoney(distance);

    if(minMoney >= money) {
      percent = 1;
    } else if(maxMoney <= money) {
      percent = 10;
    } else {
      percent = (9/(maxMoney - minMoney))*money + ((maxMoney-10*minMoney)/(maxMoney - minMoney));
    }

    serviceCharge = Math.round(money*percent*10);

    return serviceCharge;
  },
  calculateServiceChargeParabol(distance, deposit, salary, numDes, region) {
    const configServiceCharge = OrderInteractionManager.getConfig(region).serviceChage;

    let serviceCharge = 0;
    let percent;

    const minPercentage = configServiceCharge.min;
    const maxPercentage = configServiceCharge.max;
    const minMoney = this.calculateMoney(distance, configServiceCharge.minMaxMoneyStrategy.min, 1, numDes);
    const maxMoney = this.calculateMoney(distance, configServiceCharge.minMaxMoneyStrategy.max, 1, numDes);

    if(minMoney >= salary) {
      percent = minPercentage;
    } else if(maxMoney <= salary) {
      percent = maxPercentage;
    } else {
      percent = maxPercentage - (maxPercentage-minPercentage)*Math.pow((salary - maxMoney)/(maxMoney - minMoney), 2);
    }

    if(configServiceCharge.decreaseStrategy && configServiceCharge.decreaseStrategy.deposit) {
      const steps = configServiceCharge.decreaseStrategy.deposit.step;

      for(let i=0; i<steps.length; i++) {
        if(deposit >= steps[i].from && deposit <= steps[i].to) {
          percent = percent - steps[i].value;
          break;
        }
      }
    }

    if(configServiceCharge.decreaseStrategy && configServiceCharge.decreaseStrategy.numDes) {
      const steps = configServiceCharge.decreaseStrategy.numDes.step;

      for(let i=0; i<steps.length; i++) {
        if(numDes >= steps[i].from && numDes <= steps[i].to) {
          percent = percent - steps[i].value;
          break;
        }
      }
    }

    if(percent < minPercentage) {
      percent = minPercentage;
    }

    serviceCharge = salary*percent/100;

    serviceCharge = Math.floor(serviceCharge);

    return serviceCharge;
  },
  generateOrderDataClient: (orderInf, orderTypeInf, shopInf) => {
    const objPush = {
      _id: orderInf._id,
      orderType: {
        icon: orderTypeInf.icon,
        name: orderTypeInf.name
      },
      origin_place: orderInf.origin_place,
      destination_places: orderInf.destination_places,
      shop: {
        _id: shopInf._id,
        facebook: {
          id: shopInf.facebook.id,
          picture: shopInf.facebook.picture,
          name: orderInf.ensure ? "" : shopInf.facebook.name
        },
        shop: shopInf.shop,
        ship: shopInf.ship
      },
      deposit: orderInf.deposit,
      salary: orderInf.salary,
      ensure: orderInf.ensure,
      salaryStrategy: orderInf.salaryStrategy,
      distance: orderInf.distance,
      note: UtilHelper.replacePhone(orderInf.note),
      images: orderInf.images,
      tip: orderInf.tip,
      createdAt: orderInf.createdAt,
      updatedAt: orderInf.createdAt
    }

    if(orderInf.ensure) {
      objPush.shop.shop.totalPostOS = 1;
    }

    return objPush;
  }
}

function calculateMinMoney(distance) {
  let minMoney = distance*4000;

  return minMoney;
}

function calculateMaxMoney(distance) {
  return distance*5000;
}
