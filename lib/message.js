module.exports = {
	JOB: {
		REGITERED: {
			head: 'Thông báo',
			body: 'Công việc đã được đăng ký xử lý, vui lòng đăng ký công việc khác.'
		}
	},
	USER: {
		TOKEN_EXPIRE: {
			head: 'Thông báo',
			body: 'Phiên làm việc đã hết hoặc do người nào đó đã đăng nhập tài khoản của bạn ở thiết bị khác. Vui lòng đăng nhập lại. Xin cảm ơn.'
		},
		NOT_ALLOW_PUSH: {
			head: 'Thông báo',
			body: 'Không tìm thấy token để push cho User này'
		}
	},
	SYSTEM: {
		ERROR: {
			head: 'Thông báo',
			body: 'Hệ thống đang bận vui lòng thử lại'
		},
		WRONG_PARAMS: {
			head: 'Thông báo',
			body: 'Bạn vui lòng kiểm tra lại dữ liệu vừa nhập. Xin cảm ơn.'
		}
	},
	SHOP: {
		BLOCK_SHIPPER_SUCCESS: {
			head: 'Thông báo',
			body: 'Đã hạn chế Shipper nhận đơn hàng từ bạn.'
		}
	},
	ORDER: {
		WRONG_REGION_AUTHEN: {
			head: 'Thông báo',
			body: 'Khu vực xác thực tài khoản không đúng với khu vực của đơn hàng chuẩn bị nhận. Để có thể nhận đơn hàng ở khu vực khác khu vực đăng ký vui lòng qua Văn phòng xác thực lại thông tin. Hotline: 1900.633.689. Xin cảm ơn.'
		},
		WRONG_IN_APP_VALUE: {
			head: 'Thông báo',
			body: 'Đã có lỗi xảy ra trong quá trình xử lý thanh toán. Bạn vui lòng tạo đơn hàng mới. Xin cảm ơn'
		},
		RETRY_FAIL_SHOP: {
			head: 'Thông báo',
			body: 'Tìm kiếm lại đơn hàng không thành công, có thể đơn hàng của bạn đang trong trạng thái tìm kiếm Shipper. Vui lòng liên hệ 1900.633.689 để được trợ giúp. Xin cảm ơn.'
		},
		REJECT_FAIL_SHOP: {
			head: 'Thông báo',
			body: 'Hủy đơn hàng không thành công, có thể đơn hàng đang trong trạng thái tìm kiếm Shipper. Vui lòng liên hệ 1900.633.689 để được trợ giúp. Xin cảm ơn.'
		},
		REJECT_FAIL_SHIP: {
			head: 'Thông báo',
			body: 'Hủy đơn hàng không thành công, có thể đơn hàng đang không ở trạng thái được phép hủy. Vui lòng liên hệ 1900.633.689 để được trợ giúp. Xin cảm ơn.'
		},
		LIMIT_TIME_REJECT: {
			head: 'Thông báo',
			body: 'Đã quá thời gian cho phép để thao tác Huỷ đơn hàng. Nếu chưa tìm được tài xế xin vui lòng tạo lại đơn hàng mới. Cảm ơn bạn.'
		},
		DISTANCE_TOO_FAR: {
			head: 'Thông báo',
			body: 'Rất xin lỗi bạn hiện tại chúng tôi chưa phục vụ đơn hàng có khoảng cách quá xa. Xin cảm ơn.'
		},
		COMMON_ERROR: {
			head: 'Thông báo',
			body: 'Đã có lỗi xảy ra trong quá trình tìm lại đơn hàng. Bạn vui lòng chỉnh sửa đơn hàng và thử lại. Xin cảm ơn.'
		},
		TOO_MUCH_ORDER: {
			head: 'Thông báo',
			body: 'Bạn cần phải hoàn thành 1 trong các đơn hàng vừa nhận để nhận đơn kế tiếp. Kính báo'
		},
		WRONG_VAT_FEE: {
			head: 'Thông báo',
			body: 'Đã có lỗi xảy ra trong việc tính phí VAT cho đơn hàng. Vui lòng thử lại. Xin cảm ơn.'
		},
		WRONG_COD_FEE: {
			head: 'Thông báo',
			body: 'Đã có lỗi xảy ra trong việc tính phí thu hộ COD cho đơn hàng. Vui lòng thử lại. Xin cảm ơn.'
		},
		WRONG_VAT_FEE_RETRY: {
			head: 'Thông báo',
			body: 'Đã có lỗi xảy ra trong việc tính phí VAT cho đơn hàng. Vui lòng chỉnh sửa đơn hàng và thử lại. Xin cảm ơn.'
		},
		WRONG_VALUE_DEPOSIT_SALARY: {
			head: 'Thông báo',
			body: 'Chào bạn hiện tại HeyU mới thay đổi cách nhập Tiền ứng Tiền Ship\n\nVí dụ bạn muốn ứng 300 nghìn đồng, trước đây bạn chỉ cần nhập 300\n\nTuy nhiên hiện tại hệ thống đã thay đổi để việc nhập Tiền ứng Tiền Ship dễ hiểu hơn, bạn sẽ nhập thêm 3 số 0 đằng sau nữa tức là 300.000₫\n\nKính báo!'
		},
		MAX_DEPOSIT_SHIPPER_AUTHENED: {
			head: 'Thông báo',
			body: 'Giới hạn hiện tại cho tiền ứng là không quá 500.000₫. Kính báo.'
		},
		WRONG_SHIPPING_FEE: {
			head: 'Thông báo',
			body: 'Có vẻ như bạn đã nhập nhầm phí giao hàng (quá cao so với quãng đường). Bạn thử kiểm tra lại nhé. Cảm ơn bạn.'
		},
		WAIT_FOR_ACTION: {
			head: 'Thông báo',
			body: 'Vui lòng thử lại trong giây lát. Xin cảm ơn.'
		},
		BLOCK_REJECT: {
			head: 'Thông báo',
			body: 'Bạn đã bị khoá tài khoản 30 phút vì huỷ bỏ đơn hệ thống, lần kế tiếp sẽ bị khoá lâu hơn bạn vui lòng kiểm tra kỹ thông tin đơn hàng trước khi bấm nhận. HeyU Team.'
		},
		FORCE_AUTHEN: {
			head: 'Thông báo',
			body: 'Loại đơn hàng này yêu cầu phải xác thực thông tin tài khoản. Bạn vui lòng chọn loại đơn hàng khác. Xin cảm ơn.'
		},
		MONEY_IS_NOMORE_VALID: {
			head: 'Thông báo',
			body: 'Đã có lỗi xảy ra trong quá trình tính phí Ship của đơn hàng này. Bạn vui lòng thoát app ra vào lại sau đó tạo đơn hàng. Xin cảm ơn.'
		},
		MONEY_IS_NOMORE_VALID_RETRY: {
			head: 'Thông báo',
			body: 'Đã có lỗi xảy ra trong quá trình tính phí Ship của đơn hàng này. Bạn vui lòng chỉnh sửa đơn hàng thay vì tìm lại. Xin cảm ơn.'
		},
		ORDER_EXPIRE: {
			head: 'Thông báo',
			body: 'Loại đơn hàng này đang không hoạt động vui lòng chọn loại đơn hàng khác. Xin cảm ơn.'
		},
		MISSING_PARAMS: {
			head: 'Thông báo',
			body: 'Bạn cần phải nhập số tiền Shipper nhận được. Xin cảm ơn!'
		},
		REJECT_SUCCESS: {
			head: 'Thông báo',
			body: 'Huỷ đơn hàng thành công, bạn có thể chỉnh sửa lại đơn hàng để tìm Shipper'
		},
		REJECT_SUCCESS_SHIPPER: {
			head: 'Thông báo',
			body: 'Huỷ nhận đơn hàng thành công'
		},
		RETRY_SUCCESS: {
			head: 'Thông báo',
			body: 'Tái kích hoạt tiến trình tìm kiếm Shipper thành công'
		},
		OTHER_TAKEN: {
			head: 'Thông báo',
			body: 'Đơn hàng đã bị huỷ bởi chủ Shop'
		},
		HAS_NOTIFY_TAKE: {
			head: 'Thông báo',
			body: 'Bạn đã gửi thông báo cho Shipper rồi.'
		},
		NEED_AUTHEN: {
			head: 'Thông báo',
			body: 'Bạn cần xác thực thông tin tại văn phòng để nhận đơn hàng này. Hotline: 1900.633.689. Xin cảm ơn.'
		}
	}
}
