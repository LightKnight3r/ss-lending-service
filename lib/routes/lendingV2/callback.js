const _ = require('lodash')
const async = require('async')
const ms = require('ms')
const OrderModel = require('../../models/order-system');
const MemberModel = require('../../models/members');
const LendingRequest = require('../../models/lendingRequest');
const LendingRequestLog = require('../../models/lendingRequestLog');
const CONSTANTS = require('../../const')
const MESSAGES = require('../../message')
const config = require('config')
const rp = require('request-promise')
const PushNotifyManager = require('../../job/pushNotify');

module.exports = (req, res) => {

  console.log('ahihi v2',req.query);


  let {id, status,doc_status,doc_code} = req.query;
  let idRequest;

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
      .findOneAndUpdate({
        'result.id': id
      },{
        lendStatus: status
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
        idRequest = result._id
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
        message = 'Bạn đã Hủy YC Ứng vốn thành công. Hãy tao yêu cầu mới ngay nào'
        break;
      case 'tu_choi':
        message = 'Yêu cầu ứng vốn của bạn đã bị từ chối. Vui lòng liên hệ tới số 1900-2094 hoặc Email info@vaymuon.vn để được hỗ trợ'
        if(req.query.reason) {
          message = `Yêu cầu ứng vốn của bạn đã bị từ chối. Vì lý do: ${req.query.reason}.Vui lòng liên hệ tới số 1900-2094 hoặc Email info@vaymuon.vn để được hỗ trợ `
        }
        break;
      case 'cho_khe_uoc':
        message = 'Hồ sơ của bạn đã được xét duyệt. Tuy nhiên bạn cần cung cấp thêm video khế ước để hoàn thành yêu cầu vay'
        if(doc_status === 'loai' && doc_code === 'khe_uoc') {
          message = 'Video khế ước của bạn chưa được duyệt. Hãy quay lại video và gửi cho chúng tôi'
        }
        break;
      case 'da_giai_ngan':
        message = 'Yêu cầu ỨNG VỐN của bạn đã được giải ngân thành công. Vui lòng theo dõi và thanh toán đúng hạn để nhận được nhiều ưu đãi của chúng tôi'
        if(id) {
          message = `Yêu cầu ỨNG VỐN ${id} của bạn đã được giải ngân thành công. Vui lòng theo dõi và thanh toán đúng hạn để nhận được nhiều ưu đãi của chúng tôi`
        }
        break;
      case 'thanh_toan_thieu':
        message = `Chỉ còn xxx ngày nữa đến hạn thanh toán khoản ứng vốn ${id} của bạn. Hãy thanh toán đúng hạn/ trước hạn để được hưởng ưu đãi cho lần vay tiếp theo nào`
        break;
      case 'hoan_thanh':
        message = `Chúc mừng bạn đã hoàn thành thanh toán ứng vốn cho yêu cầu vay ${id}. Chúng tôi rất hân hạnh được phục vụ bạn!!!`
        break;
      default:
        message = 'Có thông tin cập nhật từ yêu cầu vay của bạn, ấn để biết thông tin chi tiết'
      if(doc_status === 'loai') {
        message = 'Thông tin hồ sơ của bạn không hợp lệ. Ấn để xem thông tin chi tiết'
        if(doc_code === 'khe_uoc') {
          message = 'Video khế ước của bạn không hợp lệ. Vui lòng quay và gửi lại video khế ước nhé!'
        }
      }
    }
    LendingRequestLog
      .create({
        lendId: idRequest,
        status,
        results: req.query
      },(error, res) => {})
    PushNotifyManager
      .sendToMember(member.toHexString(), 'Thông báo', message, {link: 'MountIntroScreen'})
      .then((result) => {
        console.log('ahihi',result);
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
