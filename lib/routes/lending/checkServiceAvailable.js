const _ = require('lodash')
const async = require('async')
const ms = require('ms')
const OrderModel = require('../../models/order-system');
const MemberModel = require('../../models/members');
const OrderLogModel = require('../../models/orderLog');
const FeedbackModel = require('../../models/feedback');
const User = require('../../models/user');
const JobModel = require('../../models/job');
const JobLogModel = require('../../models/jobLog');
const ShipperAuthentication = require('../../models/shipperAuthentication');
const PushNotifyManager = require('../../job/pushNotify');
const DispatchOrder = require('../../job/dispatchOrder');
const CONSTANTS = require('../../const')
const MESSAGES = require('../../message')

module.exports = (req, res) => {

  const userId = req.user.id;
  const minRide = 10;
  const minDate = '30d'
  let totalRides = 0;

  const checkOrderCondition = (next) => {
    OrderModel
      .count({
        status:3,
        shipper: userId,
        updatedAt:{$gt:Date.now() - ms('90d')}
      },(err, count) => {
        if(err) {
          return next(err);
        }

        totalRides = count
        next();
      })
  }

  const checkCondition = (next) => {
    MemberModel.findById(userId)
    .select({
      ship:1
    })
    .populate('shipperauthentications')
    .lean()
    .exec((err, result) => {
      if(err || !result) {
        return next(err || 'cannot found member');
      }

      const maxDate = Date.now() - ms(minDate)

      if(result.ship && result.ship.isAuthen && totalRides >= 10
        && result.shipperauthentications.length > 0 && result.shipperauthentications[0].createdAt && result.shipperauthentications[0].createdAt < maxDate) {
        return next(null,{
          code: CONSTANTS.CODE.SUCCESS
        })
      }

      let data={}
      if(!result.ship.isAuthen || !result.shipperauthentications || !result.shipperauthentications.length) {
        data.notAuthen = 1
      }
      if(totalRides < minRide) {
        data.rideLeft = minRide-totalRides
      }
      if(result.shipperauthentications.length > 0 && result.shipperauthentications[0].createdAt && result.shipperauthentications[0].createdAt > maxDate) {
        data.wrongDate = 1
      }
      next(null,{
        code: CONSTANTS.CODE.SUCCESS,
        data
      })
    })
  }

  async.waterfall([
    checkOrderCondition,
    checkCondition
  ], (err, data) => {
    err && _.isError(err) && (data = {
      code: CONSTANTS.CODE.SYSTEM_ERROR,
      message: MESSAGES.SYSTEM.ERROR
    });

    res.json(data || err);
  })
}
