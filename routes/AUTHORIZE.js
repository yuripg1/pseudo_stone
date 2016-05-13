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
    console.log(result.Document.AccptrAuthstnReq.AuthstnReq);
    var transactionData = util.readProperty(result, ['Document', 'AccptrAuthstnReq', 'AuthstnReq']);
    console.log(transactionData.Envt.Card.PlainCardData.PAN);
    var cardData = {
      number: util.readProperty(transactionData, ['Envt', 'Card', 'PlainCardData', 'PAN']),
      expiryMonth: util.readProperty(transactionData, ['Envt', 'Card', 'PlainCardData', 'XpryDt']).substr(0, 4),
      expiryYear: util.readProperty(transactionData, ['Envt', 'Card', 'PlainCardData', 'XpryDt']).substr(5, 2)
    };
    console.log(cardData);
    var initiatorTransactionId = util.readProperty(transactionData, ['Tx', 'InitrTxId']);
    var authorisationResponse = 'APPR';
    var authorisationResponseReason = '0000';
    var completionRequired = (util.readProperty(transactionData, ['Tx', 'TxCaptr']) === 'true' ? false : true);
    database.connect(function _connect(err, connection) {
      if (err) {
        return res.sendStatus(500);
      }
      var sql = 'INSERT INTO transaction (initiatorTransactionId, authorisationResponse, authorisationResponseReason, completionRequired) VALUES (?, ?, ?, ?)';
      var params = [initiatorTransactionId, authorisationResponse, authorisationResponseReason, (completionRequired ? '1' : '0')];
      connection.query(sql, params, function _query(err, result) {
        if (err) {
          return res.sendStatus(500);
        }
        var recipientTransactionId = result.insertId.toString();
        var responseData = {
          Document: {
            AccptrAuthstnRspn: {
              AuthstnRspn: {
                Tx: {
                  RcptTxId: recipientTransactionId
                },
                TxRspn: {
                  AuthstnRslt: {
                    RspnToAuthstn: {
                      Rspn: authorisationResponse,
                      RspnRsn: '0000'
                    },
                    AuthstnCd: recipientTransactionId,
                    CmpltnReqrd: (completionRequired ? 'true' : 'false')
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
module.exports = router;
