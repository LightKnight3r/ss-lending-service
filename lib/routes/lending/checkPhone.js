const _ = require('lodash')
const async = require('async')
const CONSTANTS = require('../../const')
const MESSAGES = require('../../message')
const config = require('config')
const rp = require('request-promise')
const OrderModel = require('../../models/order-system');
const MemberModel = require('../../models/members');
const ShipperAuthentication = require('../../models/shipperAuthentication');
const ms = require('ms')

module.exports = (req, res) => {
  const phone = _.get(req.body, 'phone', '');
  const loanId = _.get(req.body, 'loanId', 0);
  const userId = req.user.id || ''
  const mode = req.body.modeApp;
  const serverLending = config.lending.environment ? config.proxyRequestServer.lending.live : config.proxyRequestServer.lending.test
  const userAuthen = config.lending.environment ? config.lending.user.live : config.lending.user.test;
  const passAuthen = config.lending.environment ? config.lending.pass.live : config.lending.pass.test;

  const checkParams = (next) => {
    if (!phone || !userId) {
      return next({
        code: CONSTANTS.CODE.WRONG_PARAMS
      });
    }

    next();
  }

  const checkShopCondition = (next) => {
    if(mode === 'shipper') {
      return next();
    }
    OrderModel
      .count({
        shop: userId,
        status: 3,
        updatedAt: {$gt: Date.now() - ms('90d')}
      },(err, count) => {
        if(err) {
          return next(err);
        }
        if(count/3 < 10) {
          return next({
            code: CONSTANTS.CODE.FAIL,
            message: {
              head: 'Thông báo',
              body: 'Bạn chưa đủ điều kiện để tham gia chương trình. Hãy đăng thêm đơn để tham gia chương trình nhé!'
            }
          })
        }
        next();
      })
  }

  const checkRiderCondition = (next) => {
    if(mode === 'shop') {
      return next();
    }
    OrderModel
      .count({
        shipper: userId,
        status: 3,
        updatedAt: {$gt: Date.now() - ms('90d')}
      },(err, count) => {
        if(err) {
          return next(err);
        }
        if(count < 10) {
          return next({
            code: CONSTANTS.CODE.FAIL,
            message: {
              head: 'Thông báo',
              body: 'Bạn chưa đủ điều kiện để tham gia chương trình, hãy nhận thêm đơn để có thể giam gia nhé!'
            }
          })
        }
        ShipperAuthentication
          .findOne({
            member: userId
          })
          .lean()
          .exec((err, result) => {
            if(err) {
              return next(err)
            }
            if(!result) {
              return next({
                code: CONSTANTS.CODE.FAIL,
                message: {
                  head: 'Thông báo',
                  body: 'Bạn chưa đủ điều kiện để tham gia chương trình do chưa là tài xế xác thực của HeyU!'
                }
              })
            }
            const registerAt = result.createdAt || 0;
            if(Date.now() - registerAt < ms('30d')) {
              return next({
                code: CONSTANTS.CODE.FAIL,
                message: {
                  head: 'Thông báo',
                  body: 'Bạn chưa đủ điều kiện để tham gia chương trình do tài khoản của bạn chưa đủ thời gian tham gia HeyU!'
                }
              })
            }
            next();
          })
      })
  }

  const checkPhone = (next) => {
    const options = {
      method: 'POST',
      uri: `${serverLending}/partner/forbidden`,
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
        if(result.response_code === 403) {
          return next({
            code: CONSTANTS.CODE.FAIL,
            message: 'Bạn không thể tạo yêu cầu vay vào lúc này. Bạn vui lòng kiểm tra và thử lại. Xin cảm ơn!'
          });
        }

        next(null, {
          code: CONSTANTS.CODE.SUCCESS
        });
      })
      .catch((err) => {
        return next(err);
      });
  }


  async.waterfall([
    checkParams,
    checkShopCondition,
    checkRiderCondition,
    checkPhone
  ], (err, data) => {
    err && _.isError(err) && (data = {
      code: CONSTANTS.CODE.SYSTEM_ERROR,
      message: MESSAGES.SYSTEM.ERROR
    });

    res.json(data || err);
  })
}
