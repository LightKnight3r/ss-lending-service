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


  let {id, status,doc_status,doc_code,phone} = req.query;
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
    if(!id && !phone) {
      return next({
        code: CONSTANTS.CODE.WRONG_PARAMS,
        message: 'Chưa nhận được thông tin định danh hồ sơ'
      })
    }
    next();
  }

  const findMemberByPhone = (next) => {
    if(!phone) {
      return next();
    }
    MemberModel
      .findOne({
        phone: `0${phone}`
      })
      .lean()
      .exec((err, result) => {
        if(err) {
          return next(err)
        }

        if(!result) {
          return next({
            code: CONSTANTS.CODE.FAIL,
            message: 'Cannot found member'
          })
        }

        member = result._id
        next();
      })
  }

  const findMember = (next) => {
    if(phone) {
      return next();
    }
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
        message = 'Yêu cầu ứng tiền của bạn đã bị huỷ. Vui lòng liên hệ tới số 1900-2094 hoặc Email info@vaymuon.vn để được hỗ trợ'
        if(req.query.reason) {
          message = `Yêu cầu ứng tiền của bạn đã bị huỷ vì lý do: ${req.query.reason}. Vui lòng liên hệ tới số 1900-2094 hoặc Email info@vaymuon.vn để được hỗ trợ `
        }
        break;
      case 'tu_choi':
        message = 'Yêu cầu ứng tiền của bạn đã bị từ chối. Vui lòng liên hệ tới số 1900-2094 hoặc Email info@vaymuon.vn để được hỗ trợ'
        if(req.query.reason) {
          message = `Yêu cầu ứng tiền của bạn đã bị từ chối vì lý do: ${req.query.reason}. Vui lòng liên hệ tới số 1900-2094 hoặc Email info@vaymuon.vn để được hỗ trợ `
        }
        break;
      case 'cho_khe_uoc':
        message = 'Hồ sơ của bạn đã được xét duyệt. Tuy nhiên bạn cần cung cấp thêm video khế ước để hoàn thành yêu cầu vay'
        if(doc_status === 'loai' && doc_code === 'khe_uoc') {
          message = 'Video khế ước của bạn chưa được duyệt. Hãy quay lại video và gửi cho chúng tôi'
        }
        break;
      case 'da_giai_ngan':
        message = `Yêu cầu ứng tiền ${id} của bạn đã được giải ngân thành công. Vui lòng theo dõi và thanh toán đúng hạn để nhận được nhiều ưu đãi của chúng tôi`
        if(req.query.before_day && req.query.before_day > 0) {
          message = `Chỉ còn ${req.query.before_day} ngày nữa đến hạn thanh toán khoản ứng tiền ${id}. Hãy thanh toán đúng hạn để được hưởng ưu đãi cho lần vay tiếp theo nào!`
        }
        if(req.query.overdue_day && req.query.overdue_day > 0) {
          message = `Khoản vay đã quá hạn ${req.query.overdue_day} ngày. Nhanh chóng hoàn thành thanh toán khoản vay để nhận thêm nhiều ưu đãi hấp dẫn!`
        }
        if(req.query.before_day === 0 && req.query.overdue_day === 0) {
          message = `Khoản vay đã ${id} đã đến hạn thanh toán. Nhanh chóng hoàn thành thanh toán khoản vay để nhận thêm nhiều ưu đãi hấp dẫn!`
        }
        break;
      case 'chua_thanh_toan':
        message = `Khoản vay của bạn đã quá hạn. Nhanh chóng hoàn thành thanh toán khoản vay để nhận thêm nhiều ưu đãi hấp dẫn!`
        break;
      case 'thanh_toan_thieu':
        message = `Bạn vẫn chưa thanh toán đầy đủ khoản vay của mình. Hãy thanh toán đúng hạn để được hưởng ưu đãi cho lần vay tiếp theo nào!`
        break;
      case 'hoan_thanh':
        message = `Chúc mừng bạn đã hoàn thành thanh toán ứng tiền cho yêu cầu vay ${id}. Chúng tôi rất hân hạnh được phục vụ bạn!!!`
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
    if(id) {
      LendingRequestLog
        .create({
          lendId: idRequest,
          status,
          results: req.query
        },(error, res) => {})
    }
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
    findMemberByPhone,
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
