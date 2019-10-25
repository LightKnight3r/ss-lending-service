const redisConnections = require('../connections/redis');
const noOp = function () {};
class DispatchOrder {
  constructor() {
    this.ORDER_TYPE = {
      SEARCHING: 0,
      TAKE_ORDER: 1,
      GET_ORDER: 2,
      DONE_ORDER: 3,
      CAN_NOT_FIND_SHIPPER: 4,
      REJECT_ORDER: 5,
      CAN_NOT_TAKE_ORDER: 6,
      RETURNING: 7,
      RETURN_DONE: 8
    }
  }

  dispatch(orderId, type, cb) {
    cb = cb || noOp;

    const obj = {
      id: orderId,
      type: type
    }

    redisConnections('master')
      .getConnection()
      .publish('order', JSON.stringify(obj), cb);
  }
}

module.exports = new DispatchOrder;
