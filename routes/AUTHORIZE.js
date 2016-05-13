'use strict';

var creditCard = require('credit-card');
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
    var transactionData = util.readProperty(result, ['Document', 'AccptrAuthstnReq', 'AuthstnReq']);
    var cardNumber = util.readProperty(transactionData, ['Envt', 'Card', 'PlainCardData', 'PAN']);
    var cardData = {
      cardType: creditCard.determineCardType(cardNumber),
      number: cardNumber,
      expiryMonth: util.readProperty(transactionData, ['Envt', 'Card', 'PlainCardData', 'XpryDt']).substr(5, 2),
      expiryYear: util.readProperty(transactionData, ['Envt', 'Card', 'PlainCardData', 'XpryDt']).substr(0, 4)
    };
    var cvv = util.readProperty(transactionData, ['Envt', 'Card', 'PlainCardData', 'CardSctyCd', 'CSCVal']);
    if (cvv) {
      cardData.cvv = cvv;
    }
    var validation = creditCard.validate(cardData);
    var authorisationResponse;
    var authorisationResponseReason;
    if (validation.validCardNumber && validation.validExpiryMonth && validation.validExpiryYear && ((!cardData.cvv) || (cardData.cvv && validation.validCvv)) && !validation.isExpired) {
      authorisationResponse = 'APPR';
      authorisationResponseReason = '0000';
    }
    else {
      authorisationResponse = 'DECL';
      authorisationResponseReason = '1000';
    }
    var initiatorTransactionId = util.readProperty(transactionData, ['Tx', 'InitrTxId']);
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
        connection.end(function _end(err) {
          if (err) {
            return res.sendStatus(500);
          }
          res.send(util.xmlBuilder.buildObject(responseData));
        });
      });
    });
  });
});
module.exports = router;
