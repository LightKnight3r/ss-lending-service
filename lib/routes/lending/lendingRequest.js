const _ = require('lodash')
const async = require('async')
const ms = require('ms')
const OrderModel = require('../../models/order-system');
const MemberModel = require('../../models/members');
const LendingRequest = require('../../models/lendingRequest');
const CONSTANTS = require('../../const')
const MESSAGES = require('../../message')
const config = require('config')
const rp = require('request-promise')
const PushNotifyManager = require('../../job/pushNotify');
const approveRiderHandle = require('./approveRider')


module.exports = (req, res) => {

  const {id, phone} = req.query;

  let member;

  const checkParams = (next) => {
    if(!id || !phone) {
      return next({
        code: CONSTANTS.CODE.WRONG_PARAMS
      })
    }
    next();
  }

  const findMember = (next) => {
    MemberModel
      .findOne({ phone })
      .lean()
      .exec((err, result) => {
        if(err) {
          return next(err)
        }
        if(!result) {
          return next({
            code: CONSTANTS.CODE.FAIL,
            message: 'Not found member'
          })
        }
        member = result._id
        next();
      })
  }

  const createLendingRequest = (next) => {
    let objCreate = {
      member,
      result: req.query,
      type: 2
    }
    if(req.query.fromRider) {
      objCreate.type = 0
    }
    LendingRequest
      .create(objCreate,(err, result) => {
        if(err) {
          return next(err)
        }
        next(null,{
          code: CONSTANTS.CODE.SUCCESS
        })
      })
  }

  async.waterfall([
    checkParams,
    findMember,
    createLendingRequest
  ], (err, data) => {
    err && _.isError(err) && (data = {
      code: CONSTANTS.CODE.SYSTEM_ERROR,
      message: MESSAGES.SYSTEM.ERROR
    });

    res.json(data || err);
  })
}
