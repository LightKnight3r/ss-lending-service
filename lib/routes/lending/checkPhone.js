const _ = require('lodash')
const async = require('async')
const CONSTANTS = require('../../const')
const MESSAGES = require('../../message')
const config = require('config')
const rp = require('request-promise')

module.exports = (req, res) => {
  const phone = _.get(req.body, 'phone', '');
  const loanId = _.get(req.body, 'loanId', 0);
  const serverLending = config.lending.environment ? config.proxyRequestServer.lending.live : config.proxyRequestServer.lending.test
  const userAuthen = config.lending.environment ? config.lending.user.live : config.lending.user.test;
  const passAuthen = config.lending.environment ? config.lending.pass.live : config.lending.pass.test;

  const checkParams = (next) => {
    if (!phone) {
      return next({
        code: CONSTANTS.CODE.WRONG_PARAMS
      });
    }

    next();
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
            message: {
              head: 'Thông báo',
              body: 'Bạn không thể tạo yêu cầu vay vào lúc này. Bạn vui lòng kiểm tra và thử lại. Xin cảm ơn!'
            }
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
    checkPhone
  ], (err, data) => {
    err && _.isError(err) && (data = {
      code: CONSTANTS.CODE.SYSTEM_ERROR,
      message: MESSAGES.SYSTEM.ERROR
    });

    res.json(data || err);
  })
}
