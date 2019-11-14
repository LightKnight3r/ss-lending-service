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
const PushNotifyManager = require('../../job/pushNotify');

module.exports = (req, res) => {

  let {id, status,doc_status,doc_code} = req.query;

  if(doc_status === 'loai') {
    if(doc_code === 'khe_uoc') {
      status = 'cho_khe_uoc'
    } else {
      status = 'dang_cap_nhat'
    }
  }

  const checkParams = (next) => {
    if(!id) {
      return next({
        code: CONSTANTS.CODE.WRONG_PARAMS,
        message: 'Chưa nhận được id hồ sơ'
      })
    }
    next();
  }

  const callback = (next) => {
    LendingProfile
      .findOneAndUpdate({
        loan_id: id
      },{
        status: status,
        results: req.query
      })
      .exec((err, result) => {
        if(err) {
          return next(err)
        }
        if(!result) {
          return next({
            code: CONSTANTS.CODE.SYSTEM_ERROR
          })
        }
        next(null,{
          code: CONSTANTS.CODE.SUCCESS
        })
        if(status === 'cho_khe_uoc' && doc_status === 'loai' && doc_code === 'khe_uoc') {
          LendingProfile
            .update({
              loan_id: id
            },{
              hasVideo: 0
            })
            .exec((error, res) => {})
        }

        LendingLog
          .create({
            lendId: result._id,
            status,
            results: req.query
          },(error, res) => {})
        let message = 'Có thông tin cập nhật từ yêu cầu vay của bạn, ấn để biết thông tin chi tiết'
        switch (status) {
          case 'huy':
            message = 'Yêu cầu vay của bạn đã bị từ chối. Ấn để chỉnh sửa yêu cầu vay'
            break;
          case 'tu_choi':
            message = 'Yêu cầu vay của bạn đã bị từ chối. Ấn để chỉnh sửa yêu cầu vay'
            break;
          case 'cho_khe_uoc':
            message = 'Hồ sở của bạn đã được xét duyệt. Tuy nhiên bạn cần cung cấp thêm video khế ước để hoàn thành yêu cầu vay'
            if(doc_status === 'loai' && doc_code === 'khe_uoc') {
              message = 'Video khế ước của bạn chưa được duyệt. Hãy quay lại video và gửi cho chúng tôi'
            }
            break;
          case 'da_giai_ngan':
            message = 'Yêu cầu vay của bạn đã được giải ngân. Bạn vui lòng kiểm tra tài khoản ngân hàng của mình. Ấn vào để biết thông tin'
            break;
          case 'thanh_toan_thieu':
            message = 'Bạn ơi, đã đến hạn thanh toán khoản vay từ Vay Mượn rồi. Bạn lưu ý trả sớm để không bị phạt quá hạn nhé. Ấn để biết thông tin cụ thể!'
            break;
          default:
            message = 'Có thông tin cập nhật từ yêu cầu vay của bạn, ấn để biết thông tin chi tiết'
        }

        PushNotifyManager
          .sendToMember(result.member.toHexString(), 'Thông báo', message, {link: 'LendingScreen'}, 'lending_update')
          .then((result) => {
          })
          .catch((err) => {
          })

      })
  }


  async.waterfall([
    checkParams,
    callback
  ], (err, data) => {
    err && _.isError(err) && (data = {
      code: CONSTANTS.CODE.SYSTEM_ERROR,
      message: MESSAGES.SYSTEM.ERROR
    });

    res.json(data || err);
  })
}
