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
      .populate('member', 'name')
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
        console.log('ahihi',result);
        lendRequest = result;
        next();
      })
  }


  const getUserStat = (next) => {

    const endTime = Date.now();
    const startTime = Date.now() - ms('90d');

    OrderModel.aggregate([
      {
        $match:{
          shop: lendRequest.member,
          status: 3,
          updatedAt: { $gt: startTime, $lt: endTime}
        }
      },
      {
        $project : {
          cod: '$deposit',
        }
      },
      {
        $group:{
            _id: null,
            cod: {$sum: '$cod'},
            totalOrder: {$sum: 1},
        }
      }
    ])
    .cursor({batchSize: 10, async: true})
    .exec()
    .then((cursor) => {

      let finishDetech = false;
      const results = [];


      async.doUntil((done) => {
        cursor
          .next()
          .then((data) => {
            if(data === null) {
              finishDetech = true;
              return done();
            }

            results.push(data);

            done();
          })
      }, () => {
          return finishDetech;
      }, (err) => {
        if(err) {
          return next(err);
        }
        let countOrder = 0;
        let cod = 0;
        if(results.length > 0) {
          countOrder = results[0].totalOrder
          cod =  results[0].cod
        }
        lendRequest.countOrder = countOrder/3;
        lendRequest.cod = cod/90
        next(null,{
          code: CONSTANTS.CODE.SUCCESS,
          data: lendRequest
        });
      })
    })
  }


  async.waterfall([
    checkParams,
    getLendingRequest,
    getUserStat
  ], (err, data) => {
    err && _.isError(err) && (data = {
      code: CONSTANTS.CODE.SYSTEM_ERROR,
      message: MESSAGES.SYSTEM.ERROR
    });

    res.json(data || err);
  })
}
