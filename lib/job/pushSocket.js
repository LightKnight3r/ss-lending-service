const rp = require('request-promise')
const config = require('config')

class PushSocket {
  pushToMember(userId, eventName, data) {
    return new Promise((resolve, reject) => {
      const options = {
        method: 'POST',
        uri: `${config.proxyRequestServer.socketRealtime}/api/v1.0/emit/member`,
        body: {
          eventName: eventName,
          data: data,
          userId: userId
        },
        json: true // Automatically stringifies the body to JSON
      };

      rp(options)
        .then(resolve)
        .catch(reject)
    })
  }

  pushAll(data) {
    const options = {
      method: 'POST',
      uri: `${config.proxyRequestServer.socketRealtime}/api/v1.0/emit/all`,
      body: {
        eventName: data.eventName,
        data: data.data,
        region: data.region
      },
      json: true // Automatically stringifies the body to JSON
    };

    rp(options)
      .then((result) => {
      })
      .catch((err) => {
      })
  }
}

module.exports = new PushSocket
