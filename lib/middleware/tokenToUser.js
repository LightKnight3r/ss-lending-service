const _ = require('lodash')
const redisConnections = require('../connections/redis')
const CONSTANTS = require('../const');
const MESSAGES = require('../message');

module.exports = (req, res, next) => {
  const memberToken = _.get(req, 'body.memberToken', '') || _.get(req, 'query.memberToken', '');

    if(!memberToken) {
        return res.json({
            code: CONSTANTS.CODE.TOKEN_EXPIRE,
            message: MESSAGES.USER.TOKEN_EXPIRE
        });
    }

    redisConnections('master').getConnection().get(`user:${memberToken}`, (err, result) => {
        if(err) {
            return res.json({
                code: CONSTANTS.CODE.SYSTEM_ERROR,
                message: MESSAGES.SYSTEM.ERROR
            });
        }

        if(!result) {
            return res.json({
                code: CONSTANTS.CODE.TOKEN_EXPIRE,
                message: MESSAGES.USER.TOKEN_EXPIRE
            });
        }

        try {
            const objSign = JSON.parse(result);
            if(!_.has(objSign, 'id') || !_.has(objSign, 'accessToken')) {
                return res.json({
                    code: CONSTANTS.CODE.TOKEN_EXPIRE,
                    message: MESSAGES.USER.TOKEN_EXPIRE
                });
            }

            req.user = objSign;

            next();
        } catch(e) {
            return res.json({
                code: CONSTANTS.CODE.TOKEN_EXPIRE,
                message: MESSAGES.USER.TOKEN_EXPIRE
            });
        }
    });
}
