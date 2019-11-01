const _ = require('lodash')
const async = require('async')
const ms = require('ms')
const OrderModel = require('../../models/order-system');
const MemberModel = require('../../models/members');
const ShipperAuthentication = require('../../models/shipperAuthentication');
const LendingProfile = require('../../models/lendingProfile');
const LendingLog = require('../../models/lendingLog');
const CONSTANTS = require('../../const')
const MESSAGES = require('../../message')
const rp = require('request-promise');
const mongoose = require('mongoose');
const moment = require('moment')
const config = require('config')

module.exports = (req, res) => {

  const userId = req.user.id;
  let dataSend = {};

  const serverLending = config.lending.environment ? config.proxyRequestServer.lending.live : config.proxyRequestServer.lending.test

  let phone, identityCard, photo, createdAt, totalRides, loan_id;
  let totalIncome = 0;
  const { loan, duration, bankCode, name, bankNumber,
      firstRelative, secondRelative, firstRelativePhone, secondRelativePhone, firstRelativeName, secondRelativeName,
      address, officeAddress, facebookUrl, facebookImg} = req.body;
  const checkParams = (next) => {
    if(!loan || !duration || !bankCode || !name
      || !bankNumber || !firstRelative || !secondRelative
      || !firstRelativePhone || !secondRelativePhone || !address || !firstRelativeName || !secondRelativeName) {
        return next({
          code: CONSTANTS.CODE.WRONG_PARAMS
        })
    }
    next();
  }

  const getUserInfo = (next) => {
    MemberModel
      .findById(userId)
      .select({
        phone:1,
        'ship.totalRides':1
      })
      .lean()
      .exec((err, result) => {
        if(err) {
          return next(err)
        }
        phone = result.phone;
        totalRides = result.ship.totalRides;
        next();
      })
  }

  const getImageAuthen = (next) => {
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

  const getUserStat = (next) => {

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
          totalIncome = results[0].totalCash + results[0].totalSalaryPay - results[0].totalServiceCharge
        }
        next();
      })
    })
  }

  const sendProfile = (next) => {
    dataSend = {
      phone,
      loan:{
        amount: loan,
        duration
      },
      profile:{
        nhan_tien_qua_tai_khoan_ngan_hang: {
          ho_va_ten_chu_tai_khoan_ngan_hang: name,
          so_tai_khoan_ngan_hang: bankNumber,
          chon_ngan_hang: bankCode
        },
        nguoi_than: {
          nguoi_than_1: firstRelative,
          ho_va_ten_nguoi_than_1: firstRelativeName,
          so_dien_thoai_nguoi_than_1: firstRelativePhone,
          nguoi_than_2: secondRelative,
          ho_va_ten_nguoi_than_2: secondRelativeName,
          so_dien_thoai_nguoi_than_2: secondRelativePhone
        },
        cmnd_the_can_cuoc_ho_chieu_heyu:{
          anh_chup_selfie_heyu: photo,
          anh_mat_truoc_heyu: identityCard
        },
        bang_chung_thu_nhap_heyu:{
          ngay_dang_ky_tk_heyu: moment(createdAt).format('DD-MM-YYYY'),
          tong_so_chuyen_heyu: totalRides,
          doanh_so_heyu: Math.round(totalIncome/3)
        },
        dia_chi_thuong_tru_heyu:{
          chi_tiet_heyu: address
        }
      }
    }

    if(officeAddress) {
      dataSend.profile.truong_dh_cq_cong_tac_heyu = {
        co_quan_heyu: officeAddress
      }
    }
    let tt_facebook_heyu = {

    }
    if(facebookImg) {
      tt_facebook_heyu.anh_chup_heyu = facebookImg
    }
    if(facebookUrl) {
      tt_facebook_heyu.link_facebook_heyu = facebookUrl
    }
    if(facebookImg || facebookUrl) {
      dataSend.profile.tt_facebook_heyu = tt_facebook_heyu
    }


    console.log('ahihi', dataSend);


    const options = {
      method: 'POST',
      uri: `${serverLending}/partner/create-loaner`,
      headers: {
        'Authorization': 'Basic ' + new Buffer(config.lending.user + ':' + config.lending.pass).toString('base64')
      },
      body: dataSend,
      json: true // Automatically stringifies the body to JSON
    };
    rp(options)
      .then((result) => {
        console.log('ahihi result',result);
        if(result.status === 200 && result.success && result.response_code == '00') {
          loan_id = result.data.loan_id
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

  const createLendingProfile = (next) => {
    let objCreate = {};
    objCreate.phone = phone;
    objCreate.loan = {
      amount: loan,
      duration
    }
    objCreate.loan_id = loan_id
    objCreate.profile = req.body;
    objCreate.member = req.user.id;
    objCreate.status = 'cho_duyet_cap_1'
    LendingProfile
      .create(objCreate,(err, result) => {
        if(err){
          return next(err)
        }
        LendingLog.create({
          lendId: result._id,
          status: result.status
        },(error,res) => {})
        next(null,{
          code: CONSTANTS.CODE.SUCCESS,
          data : {
            id:result._id,
            status: 'cho_duyet_cap_1'
          }
        });
      })

  }


  async.waterfall([
    checkParams,
    getUserInfo,
    getImageAuthen,
    getUserStat,
    sendProfile,
    createLendingProfile
  ], (err, data) => {
    err && _.isError(err) && (data = {
      code: CONSTANTS.CODE.SYSTEM_ERROR,
      message: MESSAGES.SYSTEM.ERROR
    });

    res.json(data || err);
  })
}
