'use strict';

var express = require('express');
var path = require('path');
var moment = require('moment');

var database = require(path.join(__dirname, '..', 'database.js'));
var util = require(path.join(__dirname, '..', 'util.js'));

// get transaction
var router = express.Router();
router.post('/', function _post(req, res) {
  console.log('check');

  // parse request XML
  util.xmlParser.parseString(req.body, function _parseString(err, result) {
    if (err) {
      return res.sendStatus(500);
    }

    // read transaction data
    var merchantId = util.readProperty(result, ['Document', 'AccptrTxStsRptRq', 'Hdr', 'InitgPty', 'Id']);

    // get database connection
    database.connect(function _connect(err, connection) {
      if (err) {
        return res.sendStatus(500);
      }

      // get transaction
      getTransaction(connection, result, function _getTransaction(err, transaction) {
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

          var TxStsRptRspn;
          if (transaction !== null) {
            TxStsRptRspn = {
              Tx: {
                Summry: {
                  RcptTxId: transaction.id,
                  InitrTxId: transaction.metaId,
                  AcqrrDtTm: (transaction.createdAt !== null ? transaction.createdAt.replace(' ', 'T') : ''),
                  FrstCaptrDtTm: (transaction.capturedAt !== null ? transaction.capturedAt.replace(' ', 'T') : ''),
                  FrstCxlDtTm: (transaction.cancelledAt !== null ? transaction.cancelledAt.replace(' ', 'T') : ''),
                  TtlOrgnlAmt: (transaction.amount / 100).toFixed(2),
                  TtlAuthrsdAmt: (transaction.authorized ? (transaction.amount / 100).toFixed(2): '0.00'),
                  TtlCaptrdAmt: (transaction.captured ? (transaction.amount / 100).toFixed(2): '0.00'),
                  TtlCancAmt: (transaction.cancelled ? (transaction.amount / 100).toFixed(2): '0.00'),
                  AuthrsdSts: (transaction.authorized ? 'FULL': 'NONE'),
                  CaptrdSts: (transaction.captured ? 'FULL': 'NONE'),
                  CancSts: (transaction.cancelled ? 'FULL': 'NONE'),
                  AcctTp: 'CRDT',
                  Ccy: '986',
                  Instlmt: {
                    TtlNbOfPmts: '1'
                  }
                }
              }
            };
          }
          else {
            TxStsRptRspn = '';
          }

          // build response XML
          var responseData = {
            Document: {
              AccptrTxStsRptRspn: {
                Hdr: {
                  MsgFctn: 'TSRP',
                  PrtcolVrsn: '2.0',
                  CreDtTm: moment().format('YYYY-MM-DDTHH:mm:SS'),
                  InitgPty: {
                    Id: merchantId
                  }
                },
                TxStsRptRspn: TxStsRptRspn
              }
            }
          };
          res.send(util.xmlBuilder.buildObject(responseData));
        });
      });
    });
  });
});

function getTransaction(connection, result, callback) {

  // get transaction id/metaId
  var requestData = util.readProperty(result, ['Document', 'AccptrTxStsRptRq', 'TxStsRpt', 'Tx', 'OrgnlTx']);
  var recipientTransactionId = util.readProperty(requestData, ['RcptTxId']);
  var initiatorTransactionId = util.readProperty(requestData, ['InitrTxId']);

  // get transaction
  var sql;
  var params;
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
}

module.exports = router;
