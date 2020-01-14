const _ = require('lodash')
const async = require('async')
const ms = require('ms')
const OrderModel = require('../../models/order-system');
const MemberModel = require('../../models/members');
const LendingRequest = require('../../models/lendingRequest');
const LendingLog = require('../../models/lendingLog');
const Contact = require('../../models/contact');
const CONSTANTS = require('../../const')
const MESSAGES = require('../../message')
const config = require('config')
const rp = require('request-promise')


module.exports = (req, res) => {

  let member;
  let phone;
  let contact = []

  const serverLending = config.lending.environment ? config.proxyRequestServer.lending.live : config.proxyRequestServer.lending.test
  const userAuthen = config.lending.environment ? config.lending.user.live : config.lending.user.test;
  const passAuthen = config.lending.environment ? config.lending.pass.live : config.lending.pass.test;

  const checkParams = (next) => {
    if(!req.body.id) {
      return next({
        code:CONSTANTS.CODE.WRONG_PARAMS
      })
    }
    next();
  }

  const getMember = (next) => {
    LendingRequest
      .findOne({_id:req.body.id})
      .lean()
      .exec((err, result) => {
        if(err || !result || !result.result || !result.result.phone) {
          return next(err)
        }
        member = result.member;
        phone = result.result.phone
        next();
      })
  }


  const findContact = (next) => {
    Contact
      .findOne({
        member
      })
      .lean()
      .exec((err, result) => {
        if(err) {
          return next(err)
        }
        if(!result) {
          return next();
        }
        contact = result.data || []
        next();
      })
  }

  const syncContact = (next) => {
    let promiseContact = []
    for (let i = 0; i < contact.length; i = i + 100) {
      const dataSync = contact.slice(i, i+100)
      promiseContact.push(makeRequest(dataSync));
    }
    Promise.all(promiseContact)
    .then(() => {
      return next(null,{
        code: CONSTANTS.CODE.SUCCESS
      })
    })
  }

  const makeRequest = (data) => {

    return new Promise((resolve,reject)=>{
      const options = {
        method: 'POST',
        uri: `${serverLending}/partner/update-contact`,
        headers: {
          'Authorization': 'Basic ' + new Buffer(userAuthen + ':' + passAuthen).toString('base64')
        },
        body: {
          phone: phone,
          phoneBooks: data
        },
        json: true // Automatically stringifies the body to JSON
      };
      rp(options)
        .then((result) => {
          console.log('ahihi',result);
          if(result.status === 200 && result.success) {
            return resolve();
          }
          reject(result);
        })
        .catch((err) => {
          reject(err)
        });
    })

  }


  async.waterfall([
    checkParams,
    getMember,
    findContact,
    syncContact
  ], (err, data) => {
    err && _.isError(err) && (data = {
      code: CONSTANTS.CODE.SYSTEM_ERROR,
      message: MESSAGES.SYSTEM.ERROR
    });

    res.json(data || err);
  })
}
