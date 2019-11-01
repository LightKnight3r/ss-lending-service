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
  const member = req.user.id;
  let phone, loanId, _id
  const serverLending = config.lending.environment ? config.proxyRequestServer.lending.live : config.proxyRequestServer.lending.test

  const getLendingInfo = (next) => {
    LendingProfile
      .find({
        member
      })
      .sort({
        createdAt: -1
      })
      .limit(1)
      .lean()
      .exec((err, result) => {
        if(err) {
          return next(err);
        }
        if(!result) {
          return next(null,{
            code:CONSTANTS.CODE.SUCCESS
          })
        }
        _id = result[0]._id
        phone = result[0].phone;
        loanId = result[0].loan_id
        next()
      })
  }

  const getStatus = (next) => {
    const options = {
      method: 'POST',
      uri: `${serverLending}/partner/list-loan`,
      headers: {
        'Authorization': 'Basic ' + new Buffer(config.lending.user + ':' + config.lending.pass).toString('base64')
      },
      body: {
        phone,
        loan_id: loanId
      },
      json: true // Automatically stringifies the body to JSON
    };
    rp(options)
      .then((result) => {
        if(result.status === 200 && result.success) {
          return next(null,{
            code: CONSTANTS.CODE.SUCCESS,
            data: {
              id: _id,
              status: result.data[0].status
            }
          });
        }
        next({
          code: CONSTANTS.CODE.SYSTEM_ERROR,
          message: MESSAGES.SYSTEM.ERROR
        })
      })
      .catch((err) => {
        return next(err);
      });
  }


  async.waterfall([
    getLendingInfo,
    getStatus
  ], (err, data) => {
    err && _.isError(err) && (data = {
      code: CONSTANTS.CODE.SYSTEM_ERROR,
      message: MESSAGES.SYSTEM.ERROR
    });

    res.json(data || err);
  })
}
