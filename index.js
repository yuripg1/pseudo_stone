'use strict';

var bodyParser = require('body-parser');
var express = require('express');
var path = require('path');
var config = require(path.join(__dirname, 'config.json'));
var routeAuthorize = require(path.join(__dirname, 'routes', 'AUTHORIZE.js'));
var routeTransactionStatusReport = require(path.join(__dirname, 'routes', 'TransactionStatusReport.js'));
var app = express();
app.use(bodyParser.text({
  type: 'application/xml',
}));
app.use('/AUTHORIZE', routeAuthorize);
app.use('/TransactionStatusReport', routeTransactionStatusReport);
app.listen(config.port);
