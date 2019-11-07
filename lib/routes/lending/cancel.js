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
  let resultCancel
  const serverLending = config.lending.environment ? config.proxyRequestServer.lending.live : config.proxyRequestServer.lending.test

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
        console.log('ahihi',result);
        if(result && result.status === 200 && result.success) {
          resultCancel = result
          return next();
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

  const modifyLending = (next) => {
    LendingProfile
      .update({_id},{
        status: 'huy',
        results: resultCancel
      })
      .lean()
      .exec((err,result) => {
        if(err) {
          return next(err);
        }
        LendingLog
          .create({
            lendId: _id,
            status: 'huy',
            results: resultCancel
          },(error, res) => {
            next(null,{
              code:CONSTANTS.CODE.SUCCESS,
              data: {
                status:'huy'
              }
            })
          })
      })
  }


  async.waterfall([
    getLendingInfo,
    cancel,
    modifyLending
  ], (err, data) => {
    err && _.isError(err) && (data = {
      code: CONSTANTS.CODE.SYSTEM_ERROR,
      message: MESSAGES.SYSTEM.ERROR
    });

    res.json(data || err);
  })
}
