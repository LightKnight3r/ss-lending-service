const _ = require('lodash')
const config = require('config')
const express = require('express')
const mongoose = require('mongoose')
const cachegoose = require('cachegoose')
const Logger = require('./lib/logger')

// Global variables
global.logger = Logger(`${__dirname}/logs`);
global.dirIndex = __dirname;

// Middleware
const bodyParser = require('body-parser')
const tokenToUserMiddleware = require('./lib/middleware/tokenToUser');

// Handle routes
const BankHandle = require('./lib/routes/bank');
const LendingHandle = require('./lib/routes/lending')

// Start server
const app = express();
const server = require('http').Server(app);

app.use(bodyParser.json());

// Routes

//feedback
app.post('/api/v1.0/bank/get-bank-codes', tokenToUserMiddleware, BankHandle.getBankCodes);
app.post('/api/v1.0/lending/get-config',tokenToUserMiddleware, LendingHandle.getConfig);
app.post('/api/v1.0/lending/send-profile', tokenToUserMiddleware, LendingHandle.sendProfile);
app.post('/api/v1.0/lending/get-status',tokenToUserMiddleware, LendingHandle.getStatus);
app.post('/api/v1.0/lending/cancel', tokenToUserMiddleware, LendingHandle.cancel);
app.get('/api/v2.0/lending/callback', LendingHandle.callback);

const port = process.env.PORT || _.get(config, 'port', 3000);
server.listen(port, () => {
  logger.logInfo('Server listening at port:', port)
});

process.on('uncaughtException', (err) => {
  logger.logError('uncaughtException', err)
});
