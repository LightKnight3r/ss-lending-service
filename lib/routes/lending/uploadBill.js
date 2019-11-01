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
  const amount = req.body.amount || 0;
  const bank = req.body.bank || '';
  const image = req.body.image || '';
  let phone, loanId
  const serverLending = config.lending.environment ? config.proxyRequestServer.lending.live : config.proxyRequestServer.lending.test

  const checkParams = (next) => {
    if(!amount || !bank || !image) {
      return next({
        code: CONSTANTS.CODE.WRONG_PARAMS
      })
    }
    next();
  }

  const getLendingInfo = (next) => {
    LendingProfile
      .findOne({
        _id
      })
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
        loanId = result.loan_id
        next()
      })
  }

  const uploadBill = (next) => {
    console.log('ahihi',{
      phone,
      loan_id: loanId,
      amount,
      bank,
      image
    });
    const options = {
      method: 'POST',
      uri: `${serverLending}/partner/upload-bill`,
      headers: {
        'Authorization': 'Basic ' + new Buffer(config.lending.user + ':' + config.lending.pass).toString('base64')
      },
      body: {
        phone,
        loan_id: loanId,
        amount,
        bank,
        image
      },
      json: true // Automatically stringifies the body to JSON
    };
    rp(options)
      .then((result) => {
        console.log('ahihi',result);
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
        console.log('ahihi',err);
        return next(err);
      });
  }


  async.waterfall([
    checkParams,
    getLendingInfo,
    uploadBill
  ], (err, data) => {
    err && _.isError(err) && (data = {
      code: CONSTANTS.CODE.SYSTEM_ERROR,
      message: MESSAGES.SYSTEM.ERROR
    });

    res.json(data || err);
  })
}
