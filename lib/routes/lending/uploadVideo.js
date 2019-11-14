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
var ffmpeg = require('fluent-ffmpeg');

module.exports = (req, res) => {

  const _id = req.body.id || '';
  let phone, loanId, filePath
  const serverLending = config.lending.environment ? config.proxyRequestServer.lending.live : config.proxyRequestServer.lending.test
  const userAuthen = config.lending.environment ? config.lending.user.live : config.lending.user.test;
  const passAuthen = config.lending.environment ? config.lending.pass.live : config.lending.pass.test;

  const checkParams = (next) => {
    if(!req.file || !_id) {
      return next({
        code: CONSTANTS.CODE.WRONG_PARAMS
      })
    }
    next();
  }

  const uploadFile = (next) => {
    const path = `${ABSPATH}/public/uploads/${req.file.filename}.mp4`;

    fs.rename(req.file.path, path, function(err) {
      if (err) {
        return next({
          code: CONSTANTS.CODE.FAIL,
          message: 'File uploaded not successfully',
        })
      }
      filePath = path
      next();
    });
  }

  const compressFile = (next) => {
    ffmpeg(filePath).audioBitrate(100)
    .size('400x600')
    .on('error', function(err) {
      console.log('An error occurred: ' + err.message);
      return next({
        code: CONSTANTS.CODE.FAIL,
        message: 'File uploaded not successfully',
      })
    })
    .on('end', function() {
      if (fs.existsSync(filePath)){
        fs.unlink(filePath, (err) => {});
      }
      filePath = `${ABSPATH}/public/uploads/videos/${req.file.filename}.mp4`
      next();
    })
    .save(`${ABSPATH}/public/uploads/videos/${req.file.filename}.mp4`);
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
        'Authorization': 'Basic ' + new Buffer(userAuthen + ':' + passAuthen).toString('base64')
      },
      formData: {
          phone,
          loan_id:loanId,
          video: {
              value: fs.createReadStream(filePath),
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
        if (fs.existsSync(filePath)){
          fs.unlink(filePath, (err) => {});
        }
        console.log('ahihi',result);
        if(result.status === 200 && result.success) {
          LendingProfile
            .update({
              _id
            },{
              hasVideo: 1
            })
            .exec((error, res) => {})
          return next(null,{
            code: CONSTANTS.CODE.SUCCESS
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
    checkParams,
    uploadFile,
    compressFile,
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
