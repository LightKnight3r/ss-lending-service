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
          ],
    percentage: 0.002,
    penaltyPercentage: 0.015,
    content:{
      intro1:'Chào mừng các tài xế đến với chương trình Tạm ứng thanh toán - Hỗ trợ ứng tiền với mức phí ưu đãi.',
      intro2:'Chương trình hợp tác giữa HeyU & Lendmo, một sản phẩm thuộc Công ty Cổ phần Vay Mượn, hoạt động theo mô hình P2P Lending. Thủ tục hoàn toàn Online, nhận tiền ngay về tài khoản Ngân hàng với mức phí chỉ 0,2%/ ngày.',
      intro3:'Mọi thông tin Quý khách vui lòng cung cấp chính xác để Lendmo xác thực được nhanh chóng.',
      intro4:'“Đồng ý và tạo yêu cầu” đồng nghĩa với việc Quý khách hoàn toàn đồng ý với các điều khoản của Lendmo',
      support:'Trong quá trình Tạm ứng, mọi thắc mắc xin liên hệ',
      depositInfTitle:'Thông tin chi tiết tạm ứng:',
      mountInf1:'Thông tin chi tiết tạm ứng:',
      mountInf2:'Số tiền tạm ứng yêu cầu:',
      mountInf3:'Thời gian yêu cầu:',
      mountInf4:'Số tiền được duyệt tạm ứng:',
      mountInf5:'Thời gian được duyệt:',
      mountInf6:'Tổng số tiền phải trả:',
      mountInf7:'Số tiền đã thanh toán:',
      mountInf8:'Số tiền còn lại:',
      mountInf9:'Thời gian tạo:',
      mountInf10:'Thời gian giải ngân:',
      mountInf11:'Thời gian đến hạn thanh toán:',
      mountInf12:'Số ngày quá hạn thanh toán:',
      mountInf13:'Số tiền phạt quá hạn:',
      status1:'Hồ sơ của bạn đã được gửi thành công!',
      status2:'Yêu cầu tạm ứng đang trong quá trình phê duyệt bởi LENDMO.',
      status3:'Yêu cầu tạm ứng đang được chờ giải ngân, bạn vui lòng đợi chút để được nhận tiền tạm ứng nhé!',
      status4:'Yêu cầu tạm ứng đang được giải ngân, bạn vui lòng đợi chút để được nhận tiền tạm ứng nhé!',
      status5:'Yêu cầu tạm ứng được giải ngân thành công!',
      status6:'Bạn vẫn chưa thanh toán hết khoản tạm ứng',
      status7:'Hướng dẫn thanh toán',
      status8:'Gửi thông tin chứng từ thanh toán:',
      status9:'Gửi chứng từ thanh toán',
      status10:'Yêu cầu tạm ứng của bạn đã bị huỷ',
      status11:'Ấn xem lại hồ sơ để chỉnh sửa và gửi lại yêu cầu tạm ứng của bạn nếu có nhu cầu nhé !',
      status12:'Xem lại Yêu cầu tạm ứng',
      status13:'Yêu cầu tạm ứng của bạn đã bị từ chối',
      status14:'Bạn đã hoàn thành thanh toán tạm ứng',
      status15:'Bạn có muốn tiếp tục tạm ứng một lần nữa?',
      status16:'Rất tiếc, Tạm thời bạn không thể tạm ứng vào lúc này!',
      status17:'Rất tiếc, Hồ sơ của bạn chưa được phê duyệt, bạn cần xem lại một số thông tin.',
      status18:'Hồ sơ tạm ứng của bạn đã được xét duyệt bước đầu.',
      status19:'Để hoàn thành hồ sơ Tạm ứng, bạn cần bổ sung thêm Video khế ước.',
      status20:'Hãy đọc chính xác nội dung theo mẫu dưới đây và quay lại để gửi cho chúng tôi.',
      status21:'Video khế ước của bạn đã được gửi, bạn vui lòng đợi trong ít phút để LENDMO thực hiện xét duyệt.',
      status22:'Video khế ước',
      status23:'Vui lòng nhập đầy đủ thông tin trước khi gửi chứng từ',
      status24:'Ảnh chứng từ',
      status25:'Bạn chưa chọn video khế ước',
      mountStep1:'Tiền ứng:',
      mountStep2:'Hình thức thanh toán:',
      mountStep3:'Số tiền dự kiến phải trả:',
      mountStep4:'Lưu ý: Nếu không trả đúng hạn, bạn phải chịu thêm phí quá hạn là:',
      mountStep5:'Tài khoản nhận tiền:',
      navbar1:'Tạm ứng thanh toán',
      navbar2:'Thông tin Tạm ứng',
      valid1:'Xin mời bạn chọn Tiền ứng \n',
      valid2:'Xin mời bạn chọn thời hạn \n',
      cancel:'Huỷ Yêu cầu tạm ứng',
      message:'Bạn vẫn chưa điều kiện để tham gia chương trình Tạm ứng thanh toán'
    }
  }

  if(req.body.platform === 'ios') {
    config.content = null
  }

  const getConfig = (next) => {
    next(null,{
      code: CONSTANTS.CODE.SUCCESS,
      message: {
        head: 'Thông báo',
        body: 'Bạn cần cập nhật phiên bản HeyU mới nhất trên kho ứng dụng để có thể tham gia chương trình Tạm ứng thanh toán!'
      },
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
