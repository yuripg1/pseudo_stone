'use strict';

var express = require('express');
var path = require('path');
var moment = require('moment');

var database = require(path.join(__dirname, '..', 'database.js'));
var testCards = require(path.join(__dirname, '..', 'testCards.json'));
var util = require(path.join(__dirname, '..', 'util.js'));

// authoriza a transaction
var router = express.Router();
router.post('/', function _post(req, res) {
  console.log('authorize');

  // parse request XML
  util.xmlParser.parseString(req.body, function _parseString(err, result) {
    if (err) {
      return res.sendStatus(500);
    }

    // read transaction data
    var transactionData = util.readProperty(result, ['Document', 'AccptrAuthstnReq', 'AuthstnReq']);
    var merchantId = util.readProperty(transactionData, ['Envt', 'Mrchnt', 'Id', 'Id']);
    var merchantShortName = util.readProperty(transactionData, ['Envt', 'Mrchnt', 'Id', 'ShrtNm']);
    var cardNumber = util.readProperty(transactionData, ['Envt', 'Card', 'PlainCardData', 'PAN']);
    var expirationDate = util.readProperty(transactionData, ['Envt', 'Card', 'PlainCardData', 'XpryDt']);
    var cvv = util.readProperty(transactionData, ['Envt', 'Card', 'PlainCardData', 'CardSctyCd', 'CSCVal']);

    var initiatorTransactionId = util.readProperty(transactionData, ['Tx', 'InitrTxId']);
    var capture = (util.readProperty(transactionData, ['Tx', 'TxCaptr']) === 'true' ? true : false);
    var transactionDateTime = util.readProperty(transactionData, ['Tx', 'TxId', 'TxDtTm']);
    var transactionReference = util.readProperty(transactionData, ['Tx', 'TxId', 'TxRef']);
    var amount = util.readProperty(transactionData, ['Tx', 'TxDtls', 'TtlAmt']);

    var delay = Number(('00000' + cardNumber).slice(-5));

    // approve/decline transaction
    var authorisationResponse;
    var authorisationResponseReason;
    var authorized;

    // get test card
    var isTestCard = false;
    var testCardIndex;
    for (var i in testCards) {
      if (testCards[i].cardNumber.substring(0, 11) === cardNumber.substring(0, 11)) {
        isTestCard = true;
        testCardIndex = i;
        break;
      }
    }

    // if card is not a test card, decline transaction
    // else, check card expiration date and cvv
    if (!isTestCard
        || testCards[testCardIndex].expirationDate !== expirationDate
        || (cvv && testCards[testCardIndex].cvv !== cvv)) {
      authorisationResponse = 'DECL';
      authorisationResponseReason = '1000';
      authorized = false;
    }
    else {
      authorisationResponse = 'APPR';
      authorisationResponseReason = '0000';
      authorized = true;
    }

    // create the transaction after the delay
    setTimeout(function _setTimeout() {

      // get database connection
      database.connect(function _connect(err, connection) {
        if (err) {
          return res.sendStatus(500);
        }

        // persist transaction
        var sql = 'INSERT INTO transaction (metaId, amount, authorized, authorisationResponse, authorisationResponseReason, captured, cancelled, createdAt, capturedAt) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), ?)';
        var params = [initiatorTransactionId, amount, (authorized ? '1' : '0'), authorisationResponse, authorisationResponseReason, (authorized && capture ? '1' : '0'), '0', (authorized && capture ? new Date() : null)];
        connection.query(sql, params, function _query(err, result) {
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

            // build response XML
            var recipientTransactionId = result.insertId.toString();
            var responseData = {
              Document: {
                AccptrAuthstnRspn: {
                  Hdr: {
                    MsgFctn: 'AUTQ',
                    PrtcolVrsn: '2.0',
                    CreDtTm: moment().format('YYYY-MM-DDTHH:mm:SS')
                  },
                  AuthstnRspn: {
                    Envt: {
                      MrchntId: {
                        Id: merchantId,
                        ShrtNm: merchantShortName
                      }
                    },
                    Tx: {
                      TxId: {
                        TxDtTm: transactionDateTime,
                        TxRef: transactionReference
                      },
                      RcptTxId: recipientTransactionId,
                      TxDtls: {
                        Ccy: '986',
                        TtlAmt: amount,
                        AcctTp: 'CRDT'
                      }
                    },
                    TxRspn: {
                      AuthstnRslt: {
                        RspnToAuthstn: {
                          Rspn: authorisationResponse,
                          RspnRsn: authorisationResponseReason
                        },
                        AuthstnCd: 'xxxxxx', // identificador da transação do emissor
                        CmpltnReqrd: (capture ? 'false' : 'true')
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
    }, delay);
  });
});

module.exports = router;
