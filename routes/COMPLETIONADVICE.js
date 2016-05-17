'use strict';

var express = require('express');
var path = require('path');
var moment = require('moment');

var database = require(path.join(__dirname, '..', 'database.js'));
var util = require(path.join(__dirname, '..', 'util.js'));

// capture a transaction
var router = express.Router();
router.post('/', function _post(req, res) {
  console.log('capture');

  // parse request XML
  util.xmlParser.parseString(req.body, function _parseString(err, result) {
    if (err) {
      return res.sendStatus(500);
    }

    // read transaction data
    var transactionData = util.readProperty(result, ['Document', 'AccptrCmpltnAdvc', 'CmpltnAdvc']);
    var merchantId = util.readProperty(transactionData, ['Envt', 'Mrchnt', 'Id', 'Id']);
    var transactionDateTime = util.readProperty(transactionData, ['Tx', 'TxId', 'TxDtTm']);
    var transactionReference = util.readProperty(transactionData, ['Tx', 'TxId', 'TxRef']);

    // get database connection
    database.connect(function _connect(err, connection) {
      if (err) {
        return res.sendStatus(500);
      }

      // capture transaction
      captureTransaction(connection, result, function _captureTransaction(err, transaction) {
        if (err) {
          return connection.end(function _end() {
            return res.sendStatus(500);
          });
        }

        // end connection
        connection.end(function _end(err) {
          if (err) {
            return res.sendStatus(500);
          }

          var response;
          if (transaction === null) {
            response = 'DECL';
          }
          else {
            response = 'APPR';
          }

          // build response XML
          var responseData = {
            Document: {
              AccptrCmpltnAdvcRspn: {
                Hdr: {
                  MsgFctn: 'CMPK',
                  PrtcolVrsn: '2.0',
                  CreDtTm: moment().format('YYYY-MM-DDTHH:mm:SS')
                },
                CmpltnAdvcRspn: {
                  Envt: {
                    MrchntId: {
                      Id: merchantId
                    }
                  },
                  Tx: {
                    TxId: {
                      TxDtTm: transactionDateTime,
                      TxRef: transactionReference
                    },
                    Rspn: response
                  }
                }
              }
            }
          };
          res.send(util.xmlBuilder.buildObject(responseData));
        });
      });
    });
  });
});

function captureTransaction(connection, result, callback) {

  // read transaction data
  var transactionData = util.readProperty(result, ['Document', 'AccptrCmpltnAdvc', 'CmpltnAdvc']);
  var amount = util.readProperty(transactionData, ['Tx', 'TxDtls', 'TtlAmt']);
  var recipientTransactionId = util.readProperty(transactionData, ['Tx', 'OrgnlTx', 'RcptTxId']);

  // set captured = 1
  var sql = 'UPDATE transaction SET captured = 1, capturedAt = NOW() WHERE id = ? AND authorized = 1 AND captured = 0 AND amount = ? ORDER BY id DESC LIMIT 1';
  var params = [recipientTransactionId, amount];
  connection.query(sql, params, function _query(err, status) {
    if (err) {
      return callback(err);
    }
    if (status.affectedRows === 0) {
      return callback(null, null);
    }

    // get transaction
    sql = 'SELECT * FROM transaction WHERE id = ? ORDER BY id DESC LIMIT 1';
    params = [recipientTransactionId];
    connection.query(sql, params, function _query(err, rows) {
      if (err) {
        return callback(err);
      }
      if (rows.length === 0) {
        return callback(null, null);
      }

      callback(null, rows[0]);
    });
  });
}

module.exports = router;
