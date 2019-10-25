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
const config = require('config')
const rp = require('request-promise')

module.exports = (req, res) => {
  const serverLending = config.lending.environment ? config.proxyRequestServer.lending.live : config.proxyRequestServer.lending.test

  const getBankCodes = (next) => {
    const options = {
      method: 'GET',
      uri: `${serverLending}/partner/banks`,
      headers: {
        'Authorization': 'Basic ' + new Buffer(config.lending.user + ':' + config.lending.pass).toString('base64')
      },
      json: true // Automatically stringifies the body to JSON
    };
    rp(options)
      .then((result) => {
        if(result && result.status === 200 && result.success) {
          let data = [];

          result.data.forEach((bank) => {
            data.push({
              code: bank.code,
              label: bank.name
            })
          })
          return next(null,{
            code: CONSTANTS.CODE.SUCCESS,
            data
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
    getBankCodes
  ], (err, data) => {
    err && _.isError(err) && (data = {
      code: CONSTANTS.CODE.SYSTEM_ERROR,
      message: MESSAGES.SYSTEM.ERROR
    });

    res.json(data || err);
  })
}
