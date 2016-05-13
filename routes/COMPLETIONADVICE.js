'use strict';

var express = require('express');
var path = require('path');
var database = require(path.join(__dirname, '..', 'database.js'));
var util = require(path.join(__dirname, '..', 'util.js'));
var router = express.Router();
router.post('/', function _post(req, res) {
  util.xmlParser.parseString(req.body, function _parseString(err, result) {
    if (err) {
      return res.sendStatus(500);
    }
    database.connect(function _connect(err, connection) {
      if (err) {
        return res.sendStatus(500);
      }
      captureAndReturnTransaction(connection, result, function _searchTransaction(err, transaction) {
        if (err) {
          connection.end(function _end() {
            return res.sendStatus(500);
          });
        }
        connection.end(function _end(err) {
          if (err) {
            return res.sendStatus(500);
          }
          var responseData = {
            Document: {
              AccptrCmpltnAdvcRspn: {
                CmpltnAdvcRspn: {}
              }
            }
          };
          if (transaction) {
            responseData.Document.AccptrCmpltnAdvcRspn.CmpltnAdvcRspn = {
              Tx: {
                Rspn: 'APPR'
              }
            };
          }
          res.send(util.xmlBuilder.buildObject(responseData));
        });
      });
    });
  });
});
function captureAndReturnTransaction(connection, request, callback) {
  var recipientTransactionId = util.readProperty(request, ['Document', 'AccptrCmpltnAdvc', 'CmpltnAdvc', 'Tx', 'OrgnlTx', 'RcptTxId']);
  var sql = 'UPDATE transaction SET cancelled = 1 WHERE recipientTransactionId = ? AND cancelled = 0 ORDER BY recipientTransactionId DESC LIMIT 1';
  var params = [recipientTransactionId];
  connection.query(sql, params, function _query(err) {
    if (err) {
      return callback(err);
    }
    sql = 'SELECT * FROM transaction WHERE recipientTransactionId = ? ORDER BY recipientTransactionId DESC LIMIT 1';
    params = [recipientTransactionId];
    connection.query(sql, params, function _query(err, rows) {
      if (err) {
        return callback(err);
      }
      if (rows.length === 0) {
        return callback(null, null);
      }
      return callback(null, rows[0]);
    });
  });
}
module.exports = router;
