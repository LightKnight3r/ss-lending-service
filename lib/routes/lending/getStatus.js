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
  let phone, loanId, _id, profile, lendInf, hasVideo
  const serverLending = config.lending.environment ? config.proxyRequestServer.lending.live : config.proxyRequestServer.lending.test
  const userAuthen = config.lending.environment ? config.lending.user.live : config.lending.user.test;
  const passAuthen = config.lending.environment ? config.lending.pass.live : config.lending.pass.test;

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
        if(result.length === 0) {
          return next()
        }
        _id = result[0]._id
        phone = result[0].phone;
        loanId = result[0].loan_id;
        profile = result[0].profile;
        hasVideo = result[0].hasVideo;
        if(result[0].results) {
          lendInf = result[0].results
        }
        next()
      })
  }

  const getStatus = (next) => {
    if(!_id) {
      return next(null,{
        code:CONSTANTS.CODE.SUCCESS
      })
    }
    const options = {
      method: 'POST',
      uri: `${serverLending}/partner/list-loan`,
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
        if(result.status === 200 && result.success) {
          return next(null,{
            code: CONSTANTS.CODE.SUCCESS,
            data: {
              id: _id,
              status: result.data[0].status,
              profile,
              lendInf,
              hasVideo
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
