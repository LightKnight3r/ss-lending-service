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
const mongoose = require('mongoose');
const ShipperAuthentication = require('../../models/shipperAuthentication');
const moment = require('moment')
const uploadContactHandle = require('./uploadContact')



module.exports = (req, res) => {

  const id = req.body.id
  const fblink = req.body.fblink || ''

  let identityCard,photo,createdAt,totalIncome,totalRides,approve,phone,userId;

  const serverLending = config.lending.environment ? config.proxyRequestServer.lending.live : config.proxyRequestServer.lending.test
  const userAuthen = config.lending.environment ? config.lending.user.live : config.lending.user.test;
  const passAuthen = config.lending.environment ? config.lending.pass.live : config.lending.pass.test;

  const checkParams = (next) => {
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
        phone = result.result.phone;
        userId = result.member
        next()
      })
  }

  const getAuthenInf = (next) => {
    ShipperAuthentication
      .findOne({member: userId})
      .select({
        identityCard: 1,
        photo: 1,
        createdAt: 1
      })
      .lean()
      .exec((err, result) => {
        if(err) {
          return next(err)
        }
        if(!result) {
          return next({
            code: CONSTANTS.CODE.SYSTEM_ERROR,
            message: MESSAGES.SYSTEM.ERROR
          })
        }
        identityCard = result && result.identityCard ? result.identityCard : '';
        photo = result && result.photo ? result.photo : '';

        const fileName = photo ? photo.split('/')[photo.split('/').length - 1] : '';
        photo = photo ? `https://cms.heyu.asia/uploads/avatars/${fileName}` : '';
        const fileNameId = identityCard ? identityCard.split('/')[identityCard.split('/').length - 1] : '';
        identityCard = identityCard ? `https://cms.heyu.asia/uploads/indentityCards/${fileNameId}` : '';
        createdAt = result && result.createdAt ? result.createdAt : '';
        next();
      })
  }

  const getUserStats = (next) => {
    const endTime = Date.now();
    const startTime = Date.now() - ms('90d');

    OrderModel.aggregate([
      {
        $match:{
          "acceptedAt": { $gt: startTime, $lt: endTime},
          "status":3,
          "shipper": new mongoose.mongo.ObjectId(userId)
        }
      },
      {
        $project : {
          salaryPay: '$salaryStrategy.pay',
          serviceCharge: '$serviceCharge',
          cash: { '$add' : [ '$salaryStrategy.direct', '$salaryStrategy.tip', '$salaryStrategy.CODFee' ] }
        }
      },
      {
        $group:{
            _id: null,
            totalSalaryPay: {$sum: '$salaryPay'},
            totalCash: {$sum: '$cash'},
            totalOrder: {$sum: 1},
            totalServiceCharge: {$sum: '$serviceCharge'}
        }
      }
    ])
    .cursor({batchSize: 10, async: true})
    .exec()
    .then((cursor) => {

      let finishDetech = false;
      const results = [];


      async.doUntil((done) => {
        cursor
          .next()
          .then((data) => {
            if(data === null) {
              finishDetech = true;
              return done();
            }

            results.push(data);

            done();
          })
      }, () => {
          return finishDetech;
      }, (err) => {
        if(err) {
          return next(err);
        }
        if(results.length !== 0) {
          totalIncome = results[0].totalCash + results[0].totalSalaryPay - results[0].totalServiceCharge;
          totalRides =  results.length === 0 ? 0 : results[0].totalOrder
        }
        next();
      })
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
          anh_xac_thuc_heyu:{
            anh_chup_selfie_heyu: photo,
            anh_xac_thuc_cmnd_heyu: identityCard
          },
          bang_chung_thu_nhap_heyu:{
            ngay_dang_ky_tk_heyu: moment(createdAt).format('DD-MM-YYYY'),
            tong_so_chuyen_heyu: totalRides,
            doanh_so_heyu: Math.round(totalIncome/3)
          },
          tt_facebook_heyu: {
            link_facebook_heyu: fblink
          }
        }
      },
      json: true // Automatically stringifies the body to JSON
    };
    rp(options)
      .then((result) => {
        console.log('ahihi',result);
        if(result.status === 200 && result.success) {
          approve = {
            photo,
            identityCard,
            totalRides,
            fblink,
            totalIncome: Math.round(totalIncome/3),
            registerAt: moment(createdAt).format('DD-MM-YYYY')
          }
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
        approve
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
    getAuthenInf,
    getUserStats,
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
