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
const PushNotifyManager = require('../../job/pushNotify');

module.exports = (req, res) => {

  let {id, status,doc_status,doc_code} = req.query;

  let member;

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

  const findMember = (next) => {
    LendingRequest
      .findOne({
        'result.id': id
      })
      .lean()
      .exec((err, result) => {
        if(err) {
          return next(err);
        }
        if(!result) {
          return next({
            code: CONSTANTS.CODE.FAIL,
            message: 'Cannot found the request'
          })
        }
        member = result.member
        next();
      })
  }

  const notify = (next) => {
    next(null,{
      code: CONSTANTS.CODE.SUCCESS
    })
    let message = 'Có thông tin cập nhật từ yêu cầu vay của bạn, ấn để biết thông tin chi tiết'
    switch (status) {
      case 'huy':
        message = 'Yêu cầu vay của bạn đã bị từ chối. Ấn để chỉnh sửa yêu cầu vay'
        if(req.query.reason) {
          message = `Yêu cầu vay của bạn đã bị từ chối vì lý do: ${req.query.reason}. Ấn để chỉnh sửa yêu cầu vay`
        }
        break;
      case 'tu_choi':
        message = 'Yêu cầu vay của bạn đã bị từ chối. Ấn để chỉnh sửa yêu cầu vay'
        if(req.query.reason) {
          message = `Yêu cầu vay của bạn đã bị từ chối vì lý do: ${req.query.reason}. Ấn để chỉnh sửa yêu cầu vay`
        }
        break;
      case 'cho_khe_uoc':
        message = 'Hồ sơ của bạn đã được xét duyệt. Tuy nhiên bạn cần cung cấp thêm video khế ước để hoàn thành yêu cầu vay'
        if(doc_status === 'loai' && doc_code === 'khe_uoc') {
          message = 'Video khế ước của bạn chưa được duyệt. Hãy quay lại video và gửi cho chúng tôi'
        }
        break;
      case 'da_giai_ngan':
        message = 'Yêu cầu vay của bạn đã được giải ngân. Bạn vui lòng kiểm tra tài khoản ngân hàng của mình. Ấn vào để biết thông tin'
        break;
      case 'thanh_toan_thieu':
        message = 'Bạn ơi, đã đến hạn thanh toán khoản vay từ Lendmo rồi. Bạn lưu ý trả sớm để không bị phạt quá hạn nhé. Ấn để biết thông tin cụ thể!'
        break;
      default:
        message = 'Có thông tin cập nhật từ yêu cầu vay của bạn, ấn để biết thông tin chi tiết'
    }

    PushNotifyManager
      .sendToMember(member.toHexString(), 'Thông báo', message, {link: 'MountIntroScreen'})
      .then((result) => {
      })
      .catch((err) => {
      })
  }


  async.waterfall([
    checkParams,
    findMember,
    notify
  ], (err, data) => {
    err && _.isError(err) && (data = {
      code: CONSTANTS.CODE.SYSTEM_ERROR,
      message: MESSAGES.SYSTEM.ERROR
    });

    res.json(data || err);
  })
}
