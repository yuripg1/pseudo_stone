'use strict';

var express = require('express');
var path = require('path');
var moment = require('moment');

var database = require(path.join(__dirname, '..', 'database.js'));
var util = require(path.join(__dirname, '..', 'util.js'));

// calcel a transaction
var router = express.Router();
router.post('/', function _post(req, res) {
  console.log('cancel');

  // parse request XML
  util.xmlParser.parseString(req.body, function _parseString(err, result) {
    if (err) {
      return res.sendStatus(500);
    }

    // read transaction data
    var transactionData = util.readProperty(result, ['Document', 'AccptrCxlReq', 'CxlReq']);
    var merchantId = util.readProperty(transactionData, ['Envt', 'Mrchnt', 'Id', 'Id']);
    var transactionDateTime = util.readProperty(transactionData, ['Tx', 'TxId', 'TxDtTm']);
    var transactionReference = util.readProperty(transactionData, ['Tx', 'TxId', 'TxRef']);
    var amount = util.readProperty(transactionData, ['Tx', 'TxDtls', 'TtlAmt']);

    // get database connection
    database.connect(function _connect(err, connection) {
      if (err) {
        return res.sendStatus(500);
      }

      // cancel transaction
      cancelTransaction(connection, result, function _cancelTransaction(err, transaction) {
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
          var responseReason;
          var transactionId;
          if (transaction === null) {
            response = 'DECL';
            responseReason = '0000';
            transactionId = '';
          }
          else {
            response = 'APPR';
            responseReason = '0000';
            transactionId = transaction.id;
          }

          // build response XML
          var responseData = {
            Document: {
              AccptrCxlRspn: {
                Hdr: {
                  MsgFctn: 'CCAP',
                  PrtcolVrsn: '2.0',
                  CreDtTm: moment().format('YYYY-MM-DDTHH:mm:SS')
                },
                CxlRspn: {
                  Envt: {
                    MrchntId: {
                      Id: merchantId
                    }
                  },
                  TxRspn: {
                    AuthstnRslt: {
                      RspnToAuthstn: {
                        Rspn: response,
                        RspnRsn: responseReason
                      },
                      CmpltnReqrd: 'false'
                    }
                  },
                  Tx: {
                    TxId: {
                      TxDtTm: transactionDateTime,
                      TxRef: transactionReference
                    },
                    RcptTxId: transactionId,
                    TxDtls: {
                      Ccy: '986',
                      TtlAmt: amount
                    }
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

function cancelTransaction(connection, result, callback) {

  // get transaction id/metaId
  var transactionData = util.readProperty(result, ['Document', 'AccptrCxlReq', 'CxlReq']);
  var recipientTransactionId = util.readProperty(transactionData, ['Tx', 'OrgnlTx', 'RcptTxId']);
  var initiatorTransactionId = util.readProperty(transactionData, ['Tx', 'OrgnlTx', 'InitrTxId']);
  var amount = util.readProperty(transactionData, ['Tx', 'TxDtls', 'TtlAmt']);

  // set cancelled = 1
  var sql;
  var params;
  if (recipientTransactionId) {
    sql = 'UPDATE transaction SET cancelled = 1, cancelledAt = NOW() WHERE id = ? AND authorized = 1 AND cancelled = 0 AND amount = ? ORDER BY id DESC LIMIT 1';
    params = [recipientTransactionId, amount];
  }
  else {
    sql = 'UPDATE transaction SET cancelled = 1, cancelledAt = NOW() WHERE metaId = ? AND authorized = 1 AND cancelled = 0 AND amount = ? ORDER BY id DESC LIMIT 1';
    params = [initiatorTransactionId, amount];
  }
  connection.query(sql, params, function _query(err, status) {
    if (err) {
      return callback(err);
    }
    if (status.affectedRows === 0) {
      return callback(null, null);
    }

    // get transaction
    if (recipientTransactionId) {
      sql = 'SELECT * FROM transaction WHERE id = ? ORDER BY id DESC LIMIT 1';
      params = [recipientTransactionId];
    }
    else {
      sql = 'SELECT * FROM transaction WHERE metaId = ? ORDER BY id DESC LIMIT 1';
      params = [initiatorTransactionId];
    }
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
