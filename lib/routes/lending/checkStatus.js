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
  let member = req.user.id;
  let phone
  const serverLending = config.lending.environment ? config.proxyRequestServer.lending.live : config.proxyRequestServer.lending.test
  const userAuthen = config.lending.environment ? config.lending.user.live : config.lending.user.test;
  const passAuthen = config.lending.environment ? config.lending.pass.live : config.lending.pass.test;

  const getMemberInfo = (next) => {
    MemberModel
      .findById(member)
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

        phone = result.phone
        next()
      })
  }

  const getStatus = (next) => {
    const options = {
      method: 'POST',
      uri: `${serverLending}/partner/forbidden`,
      headers: {
        'Authorization': 'Basic ' + new Buffer(userAuthen + ':' + passAuthen).toString('base64')
      },
      body: {
        phone
      },
      json: true // Automatically stringifies the body to JSON
    };
    rp(options)
      .then((result) => {
        if(result.status === 200 && result.success) {
          return next(null,{
            code: CONSTANTS.CODE.SUCCESS
          });
        }
        next({
          code: CONSTANTS.CODE.SYSTEM_ERROR,
          message: {
            head:'Thông báo',
            body: result.message || 'Đã có lỗi xảy ra, có thể bạn đã tạo yêu cầu vay từ trước không thông qua HeyU'
          }
        })
      })
      .catch((err) => {
        return next(err);
      });
  }


  async.waterfall([
    getMemberInfo,
    getStatus
  ], (err, data) => {
    err && _.isError(err) && (data = {
      code: CONSTANTS.CODE.SYSTEM_ERROR,
      message: MESSAGES.SYSTEM.ERROR
    });

    res.json(data || err);
  })
}
