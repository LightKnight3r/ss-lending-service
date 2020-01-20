const _ = require('lodash')
const async = require('async')
const ms = require('ms')
const OrderModel = require('../../models/order-system');
const MemberModel = require('../../models/members');
const LendingRequest = require('../../models/lendingRequest');
const LendingLog = require('../../models/lendingLog');
const CONSTANTS = require('../../const')
const MESSAGES = require('../../message')
const config = require('config')
const rp = require('request-promise')
const uploadContactHandle = require('./uploadContact')

module.exports = (req, res) => {

  const id = req.body.id
  const fblink = req.body.fblink || '';
  const mark = req.body.mark || 0;
  const description = req.body.description || '';
  const countOrder = req.body.countOrder || 0;
  const cod = req.body.cod || 0;

  let phone;

  const serverLending = config.lending.environment ? config.proxyRequestServer.lending.live : config.proxyRequestServer.lending.test
  const userAuthen = config.lending.environment ? config.lending.user.live : config.lending.user.test;
  const passAuthen = config.lending.environment ? config.lending.pass.live : config.lending.pass.test;

  const checkParams = (next) => {
    console.log('ahihi',req.body);
    if(!id) {
      return next({
        code: CONSTANTS.CODE.WRONG_PARAMS
      })
    }
    next();
  }

  const getLendingRequest = (next) => {
    LendingRequest
      .findById(id)
      .lean()
      .exec((err, result) => {
        if(err) {
          return next(err);
        }
        if(!result || !result.result || !result.result.phone) {
          return next({
            code: CONSTANTS.CODE.FAIL
          })
        }
        phone = result.result.phone
        next()
      })
  }

  const makeRequest = (next) => {
    const options = {
      method: 'POST',
      uri: `${serverLending}/partner/update-profile`,
      headers: {
        'Authorization': 'Basic ' + new Buffer(userAuthen + ':' + passAuthen).toString('base64')
      },
      body: {
        phone: phone,
        profile: {
        	tt_facebook_heyu: {
        		link_facebook_heyu: fblink
        	},
        	heyu_xac_thuc: {
        		so_luong_don: countOrder,
      			diem_uy_tin_heyu: mark,
      			cod: cod,
      			mo_ta_diem_heyu: description
        	}
        }
      },
      json: true // Automatically stringifies the body to JSON
    };
    rp(options)
      .then((result) => {
        console.log('ahihi',result);
        if(result.status === 200 && result.success) {
          return next();
        }
        next({
          code: CONSTANTS.CODE.FAIL
        })
      })
      .catch((err) => {
        return next(err);
      });
  }

  const updateLendingRequest = (next) => {
    LendingRequest
      .update({
        _id: id
      },{
        status: 1,
        approve: {
          fblink,
          mark,
          description,
          countOrder,
          cod
        }
      },(err, result) => {
        if(err) {
          return next(err)
        }
        next()
      })
  }

  const uploadContact = (next) => {
    uploadContactHandle({
      body: {
        id
      }
    }, {
      json: (data) => {
        if(data.code !== CONSTANTS.CODE.SUCCESS) {
          return next(data);
        }
        next(null,{
          code: CONSTANTS.CODE.SUCCESS
        });
      }
    })
  }

  async.waterfall([
    checkParams,
    getLendingRequest,
    makeRequest,
    updateLendingRequest,
    uploadContact
  ], (err, data) => {
    err && _.isError(err) && (data = {
      code: CONSTANTS.CODE.SYSTEM_ERROR,
      message: MESSAGES.SYSTEM.ERROR
    });

    res.json(data || err);
  })
}
