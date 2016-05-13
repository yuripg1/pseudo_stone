'use strict';

var mysql = require('mysql');
var path = require('path');
var config = require(path.join(__dirname, 'config.json'));
module.exports.connect = function _connect(callback) {
  var connection = mysql.createConnection({
    host: config.database.host,
    user: config.database.user,
    password: config.database.password,
    database: config.database.database
  });
  connection.connect(function _connect(err) {
    callback(err, connection);
  });
};
