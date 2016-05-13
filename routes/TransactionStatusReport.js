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
      searchTransaction(connection, result, function _searchTransaction(err, transaction) {
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
              AccptrTxStsRptRspn: {
                TxStsRptRspn: {}
              }
            }
          };
          if (transaction) {
            var authrsdSts;
            var cancSts;
            var captrdSts;
            if (transaction.authorisationResponse === 'DECL') {
              authrsdSts = 'NONE';
              cancSts = 'NONE';
              captrdSts = 'NONE';
            }
            else if (transaction.cancelled === 1) {
              authrsdSts = 'FULL';
              cancSts = 'FULL';
              captrdSts = 'NONE';
            }
            else if (transaction.completionRequired === 1) {
              authrsdSts = 'FULL';
              cancSts = 'NONE';
              captrdSts = 'NONE';
            }
            else {
              authrsdSts = 'FULL';
              cancSts = 'NONE';
              captrdSts = 'FULL';
            }
            responseData.Document.AccptrTxStsRptRspn.TxStsRptRspn.Tx = {
              Summry: {
                RcptTxId: transaction.recipientTransactionId,
                AcqrrDtTm: transaction.dateCreated.replace(' ', 'T'),
                TtlOrgnlAmt: (transaction.amount / 100).toFixed(2),
                AuthrsdSts: authrsdSts,
                CancSts: cancSts,
                CaptrdSts: captrdSts
              }
            };
          }
          res.send(util.xmlBuilder.buildObject(responseData));
        });
      });
    });
  });
});
function searchTransaction(connection, request, callback) {
  var requestData = util.readProperty(request, ['Document', 'AccptrTxStsRptRq', 'TxStsRpt', 'Tx', 'OrgnlTx']);
  var recipientTransactionId = util.readProperty(requestData, ['RcptTxId']);
  var initiatorTransactionId = util.readProperty(requestData, ['InitrTxId']);
  var sql;
  var params;
  if (recipientTransactionId) {
    sql = 'SELECT * FROM transaction WHERE recipientTransactionId = ? ORDER BY recipientTransactionId DESC';
    params = [recipientTransactionId];
  }
  else {
    sql = 'SELECT * FROM transaction WHERE initiatorTransactionId = ? ORDER BY recipientTransactionId DESC';
    params = [initiatorTransactionId];
  }
  connection.query(sql, params, function _query(err, rows) {
    if (err) {
      return callback(err);
    }
    if (rows.length === 0) {
      return callback(null, null);
    }
    return callback(null, rows[0]);
  });
}
module.exports = router;
