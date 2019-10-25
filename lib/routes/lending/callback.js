const _ = require('lodash')
const async = require('async')
const ms = require('ms')
const OrderModel = require('../../models/order-system');
const MemberModel = require('../../models/members');
const LendingProfile = require('../../models/lendingProfile');
const LendingLog = require('../../models/lendingLog');
const CONSTANTS = require('../../const')
const MESSAGES = require('../../message')
const config = require('config')
const rp = require('request-promise')

module.exports = (req, res) => {

  const {id, status} = req.query;

  const checkParams = (next) => {
    if(!id) {
      return next({
        code: CONSTANTS.CODE.WRONG_PARAMS,
        message: 'Chưa nhận được id hồ sơ'
      })
    }
    if(!status) {
      return next({
        code: CONSTANTS.CODE.WRONG_PARAMS,
        message: 'Yêu cầu trạng thái hồ sơ'
      })
    }
    next();
  }

  const callback = (next) => {
    LendingProfile
      .findOneAndUpdate({
        loan_id: id
      },{
        status: status,
        results: req.query
      })
      .exec((err, result) => {
        if(err) {
          return next(err)
        }
        if(!result) {
          return next({
            code: CONSTANTS.CODE.SYSTEM_ERROR
          })
        }
        next(null,{
          code: CONSTANTS.CODE.SUCCESS
        })
        LendingLog
          .create({
            lendId: result._id,
            status,
            results: req.query
          },(error, res) => {})

      })
  }


  async.waterfall([
    checkParams,
    callback
  ], (err, data) => {
    err && _.isError(err) && (data = {
      code: CONSTANTS.CODE.SYSTEM_ERROR,
      message: MESSAGES.SYSTEM.ERROR
    });

    res.json(data || err);
  })
}
