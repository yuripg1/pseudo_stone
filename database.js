'use strict';

const mysql = require('mysql');
const path = require('path');

const config = require(path.join(__dirname, 'config.json'));

const connection = mysql.createConnection({
  host: config.database.host,
  port: config.database.port,
  user: config.database.user,
  password: config.database.password,
  database: config.database.database,
  supportBigNumbers: true,
  bigNumberStrings: true,
  dateStrings: true,
});

function connect(callback) {
  connection.connect((err) => {
    callback(err, connection);
  });
}

module.exports = {
  connect,
};
