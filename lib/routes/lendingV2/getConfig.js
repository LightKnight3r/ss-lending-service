const _ = require('lodash')
const async = require('async')
const ms = require('ms')
const OrderModel = require('../../models/order-system');
const MemberModel = require('../../models/members');
const OrderLogModel = require('../../models/orderLog');
const FeedbackModel = require('../../models/feedback');
const User = require('../../models/user');
const JobModel = require('../../models/job');
const JobLogModel = require('../../models/jobLog');
const PromoteLogModel = require('../../models/promoteLog');
const PushNotifyManager = require('../../job/pushNotify');
const DispatchOrder = require('../../job/dispatchOrder');
const CONSTANTS = require('../../const')
const MESSAGES = require('../../message')
const configure = require('config')


module.exports = (req, res) => {

  const config = {
    content:{
      title1: {
        shipper: 'Ứng tiền nhận hàng',
        shop: 'Ứng vốn kinh doanh, trả góp 0%'
      },
      title2: {
        shipper: 'LÊN ĐẾN 10 TRIỆU ĐỒNG',
        shop: '30 TRIỆU ĐỒNG'
      },
      title3: {
        shipper: '100% online, không thế chấp tài sản',
        shop: '100% online, không thế chấp tài sản'
      },
      title4: {
        shipper: 'Dành riêng cho',
        shop: 'Chỉ cần cung cấp'
      },
      title5: {
        shipper: 'TÀI XẾ XÁC THỰC CỦA HEYU',
        shop: 'CHỨNG MINH THƯ/CCCD'
      },
      contentZippo: 'Bạn hãy cho phép truy cập danh bạ để tiếp tục, điều này giúp bạn gửi thông tin phê duyệt hồ sơ của bạn cho Vay Mượn nhanh nhất.'
    },
    forceZippo: {
      android: 1,
      ios: 0
    },
    method:'webview',
    source: configure.lending.environment ? configure.lending.source.live : configure.lending.source.test
  }


  const getConfig = (next) => {
    next(null,{
      code: CONSTANTS.CODE.SUCCESS,
      data: config
    })
  }


  async.waterfall([
    getConfig
  ], (err, data) => {
    err && _.isError(err) && (data = {
      code: CONSTANTS.CODE.SYSTEM_ERROR,
      message: MESSAGES.SYSTEM.ERROR
    });

    res.json(data || err);
  })
}
