const _ = require('lodash');
const async = require('async');
const multer  = require('multer');
const CONSTANTS = require('../../const')
const MESSAGES = require('../../message');
const fs = require('fs');
const path = require('path');
const ABSPATH = path.dirname(process.mainModule.filename);
const moment = require('moment');
const config = require('config')
const upload = multer();
const LendingProfile = require('../../models/lendingProfile');
const LendingLog = require('../../models/lendingLog');
const rp = require('request-promise')

module.exports = (req, res) => {

  console.log('ahihi',req.file);

  const _id = req.body.id || '';
  let phone, loanId
  const serverLending = config.lending.environment ? config.proxyRequestServer.lending.live : config.proxyRequestServer.lending.test

  const checkParams = (next) => {
    if(!req.file || !_id) {
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

  const uploadVideo = (next) => {
    const options = {
      method: 'POST',
      uri: `${serverLending}/partner/upload-video`,
      headers: {
        'Authorization': 'Basic ' + new Buffer(config.lending.user + ':' + config.lending.pass).toString('base64')
      },
      formData: {
          phone,
          loan_id:loanId,
          video: {
              value: fs.createReadStream(`${ABSPATH}/${req.file.path}`),
              options: {
                  filename: 'video.mp4',
                  contentType: 'video/mp4'
              }
          }
      },
      json: true // Automatically stringifies the body to JSON
    };
    rp(options)
      .then((result) => {
        console.log('ahihi',result);
        // if(result.status === 200 && result.success) {
        //   return next(null,{
        //     code: CONSTANTS.CODE.SUCCESS,
        //     data: {
        //       id: _id,
        //       status: result.data[0].status
        //     }
        //   });
        // }
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
    uploadVideo
  ], (err, data) => {
    err && _.isError(err) && (data = {
      code: CONSTANTS.CODE.SYSTEM_ERROR,
      message: MESSAGES.SYSTEM.ERROR
    });

    res.json(data || err);
  })
}
