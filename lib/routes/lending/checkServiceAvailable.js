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
const PromoteLogModel = require('../../models/promoteLog');
const PushNotifyManager = require('../../job/pushNotify');
const DispatchOrder = require('../../job/dispatchOrder');
const CONSTANTS = require('../../const')
const MESSAGES = require('../../message')

module.exports = (req, res) => {

  const userId = req.user.id;

  const checkCondition = (next) => {
    MemberModel.findById(userId)
    .select({
      ship:1
    })
    .lean()
    .exec((err, result) => {
      if(err || !result) {
        return next(err || 'cannot found member');
      }

      if(result.ship && result.ship.isAuthen && result.ship.totalRides > 100) {
        return next(null,{
          code: CONSTANTS.CODE.SUCCESS
        })
      }

      next(null,{
        code: CONSTANTS.CODE.SUCCESS,
        rideLeft: 100-result.ship.totalRides
      })
    })
  }

  async.waterfall([
    checkCondition
  ], (err, data) => {
    err && _.isError(err) && (data = {
      code: CONSTANTS.CODE.SYSTEM_ERROR,
      message: MESSAGES.SYSTEM.ERROR
    });

    res.json(data || err);
  })
}
