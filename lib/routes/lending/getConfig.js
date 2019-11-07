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

module.exports = (req, res) => {

  const config = {
    durations: [10,20,30],
    linkPay:'https://vaymuon.vn/thanh_toan_khoan_vay',
    linkPivacy:'https://vaymuon.vn/thoa_thuan_nguoi_vay',
    hotline:"19002094",
    money: [
              { label: '1.000.000 đ', value: 1000000 },
              { label: '2.000.000 đ', value: 2000000 },
              { label: '3.000.000 đ', value: 3000000 },
              { label: '4.000.000 đ', value: 4000000 },
              { label: '5.000.000 đ', value: 5000000 }
          ]
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
