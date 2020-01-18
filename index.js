const _ = require('lodash')
const config = require('config')
const express = require('express')
const mongoose = require('mongoose')
const cachegoose = require('cachegoose')
const Logger = require('./lib/logger')

// Global variables
global.logger = Logger(`${__dirname}/logs`);
global.dirIndex = __dirname;
const multer  = require('multer');
const upload = multer({
  dest: 'public/uploads'
});

// Middleware
const bodyParser = require('body-parser')
const tokenToUserMiddleware = require('./lib/middleware/tokenToUser');

// Handle routes
const BankHandle = require('./lib/routes/bank');
const LendingHandle = require('./lib/routes/lending')
const LendingHandleV2 = require('./lib/routes/lendingV2')

// Start server
const app = express();
const server = require('http').Server(app);

app.use(bodyParser.json());

// Routes

//feedback
app.post('/api/v1.0/bank/get-bank-codes', tokenToUserMiddleware, BankHandle.getBankCodes);
app.post('/api/v1.0/mount/get-config',tokenToUserMiddleware, LendingHandle.getConfig);
app.post('/api/v1.0/mount/send-profile', tokenToUserMiddleware, LendingHandle.sendProfile);
app.post('/api/v1.0/mount/get-status', tokenToUserMiddleware,LendingHandle.getStatus);
app.post('/api/v1.0/mount/cancel', tokenToUserMiddleware, LendingHandle.cancel);
app.post('/api/v1.0/mount/upload-bill',tokenToUserMiddleware, LendingHandle.uploadBill);
app.post('/api/v1.0/mount/get-video-guide', tokenToUserMiddleware, LendingHandle.getVideoGuide);
app.post('/api/v1.0/mount/check-service-available', tokenToUserMiddleware, LendingHandle.checkServiceAvailable);
app.post('/api/v1.0/mount/upload-video', upload.single('fileUpload'),LendingHandle.uploadVideo);
app.get('/api/v2.0/lending/callback', LendingHandle.callback);
app.get('/api/v2.1/lending/callback', LendingHandleV2.callback);
app.get('/api/v2.0/lending/answer', LendingHandle.lendingRequest);
app.post('/api/v2.0/lending/get-request', LendingHandle.getRequest);
app.post('/api/v2.0/lending/approve', LendingHandle.approve);
app.post('/api/v2.0/lending/approve-rider', LendingHandle.approveRider);
app.post('/api/v2.0/lending/upload-contact', LendingHandle.uploadContact);
app.post('/api/v2.0/mount/check-status',tokenToUserMiddleware, LendingHandle.checkStatus);
app.post('/api/v1.0/mount/check-phone', tokenToUserMiddleware, LendingHandle.checkPhone);

const port = process.env.PORT || _.get(config, 'port', 3000);
server.listen(port, () => {
  logger.logInfo('Server listening at port:', port)
});

process.on('uncaughtException', (err) => {
  logger.logError('uncaughtException', err)
});
