const _ = require('lodash')
const async = require('async')
const ms = require('ms')
const OrderModel = require('../../models/order-system');
const MemberModel = require('../../models/members');
const OrderLogModel = require('../../models/orderLog');
const LendingRequest = require('../../models/lendingRequest');
const User = require('../../models/user');
const JobModel = require('../../models/job');
const JobLogModel = require('../../models/jobLog');
const PromoteLogModel = require('../../models/promoteLog');
const PushNotifyManager = require('../../job/pushNotify');
const DispatchOrder = require('../../job/dispatchOrder');
const CONSTANTS = require('../../const')
const MESSAGES = require('../../message')
const mongoose = require('mongoose');


module.exports = (req, res) => {

  let lendRequest;
  const endTime = Date.now();
  const startTime = Date.now() - ms('90d');

  const checkParams = (next) => {
    if(!req.body.id) {
      return next({
        code:CONSTANTS.CODE.WRONG_PARAMS
      })
    }
    next();
  }

  const getLendingRequest = (next) => {
    LendingRequest
      .findOne({_id:req.body.id})
      .populate('member', 'facebook phone')
      .lean()
      .exec((err, result) => {
        if(err) {
          return next(err)
        }

        if(!result) {
          return next({
            code: CONSTANTS.CODE.FAIL
          })
        }
        
        next(null,{
          code: CONSTANTS.CODE.SUCCESS,
          data: result
        });
      })
  }



  async.waterfall([
    checkParams,
    getLendingRequest
  ], (err, data) => {
    err && _.isError(err) && (data = {
      code: CONSTANTS.CODE.SYSTEM_ERROR,
      message: MESSAGES.SYSTEM.ERROR
    });

    res.json(data || err);
  })
}
