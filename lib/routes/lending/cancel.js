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
  const _id = req.body.id;
  let phone;
  let loanId;
  const serverLending = config.lending.environment ? config.proxyRequestServer.lending.live : config.proxyRequestServer.lending.test
  const userAuthen = config.lending.environment ? config.lending.user.live : config.lending.user.test;
  const passAuthen = config.lending.environment ? config.lending.pass.live : config.lending.pass.test;

  const getLendingInfo = (next) => {
    LendingProfile
      .findOne({_id})
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
        phone = result.phone;
        loanId = result.loan_id;
        next()
      })
  }

  const cancel = (next) => {
    const options = {
      method: 'POST',
      uri: `${serverLending}/partner/cancel-loan`,
      headers: {
        'Authorization': 'Basic ' + new Buffer(userAuthen + ':' + passAuthen).toString('base64')
      },
      body: {
        phone,
        loan_id: loanId
      },
      json: true // Automatically stringifies the body to JSON
    };
    rp(options)
      .then((result) => {
        if(result && result.status === 200 && result.success) {
          return next(null,{
            code:CONSTANTS.CODE.SUCCESS,
            status:'huy'
          });
        } else {
          next({
            code: CONSTANTS.CODE.SYSTEM_ERROR,
            message: MESSAGES.SYSTEM.ERROR
          })
        }
      })
      .catch((err) => {
        return next(err);
      });
  }

  async.waterfall([
    getLendingInfo,
    cancel
  ], (err, data) => {
    err && _.isError(err) && (data = {
      code: CONSTANTS.CODE.SYSTEM_ERROR,
      message: MESSAGES.SYSTEM.ERROR
    });

    res.json(data || err);
  })
}
