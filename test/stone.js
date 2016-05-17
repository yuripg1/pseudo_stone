'use strict';

var assert = require('assert');
var path = require('path');
var request = require('request');
var xml2js = require('xml2js');

const TIMEOUT = 30000;

//const ENDPOINT = 'https://homolog-pos.stone.com.br';
const ENDPOINT = 'http://localhost:3002';

var xmlBuilder = new xml2js.Builder({
  headless: true,
  renderOpts: {
    pretty: false
  }
});

var xmlParser = new xml2js.Parser({
  explicitArray: false
});

function createAuthorizeRequest(transaction) {

  var requestObject = {
    Document: {
      $: {
        xmlns: 'urn:AcceptorAuthorisationRequestV02.1'
      },
      AccptrAuthstnReq: {
        Hdr: {
          MsgFctn: 'AUTQ',
          PrtcolVrsn: '2.0'
        },
        AuthstnReq: {
          Envt: {
            Mrchnt: {
              Id: {
                Id: transaction.saleAffiliationKey,
                ShrtNm: transaction.softDescriptor
              }
            },
            POI: {
              Id: {
                Id: transaction.poiId
              }
            },
            Card: {
              PlainCardData: {
                PAN: transaction.PAN,
                XpryDt: transaction.expirationDate
              }
            },
            Crdhldr: {
              Nm: transaction.cardholderName
            }
          },
          Cntxt: {
            PmtCntxt: {
              CardDataNtryMd: 'PHYS',
              TxChanl: 'ECOM'
            }
          },
          Tx: {
            InitrTxId: transaction.metaId,
            TxCaptr: (transaction.capture ? 'true' : 'false'),
            TxId: {
              TxDtTm: (new Date()).toISOString().substr(0, 19),
              TxRef: transaction.metaId
            },
            TxDtls: {
              Ccy: '986',
              AcctTp: 'CRDT',
              TtlAmt: transaction.amount,
              RcrngTx: {
                InstlmtTp: 'NONE',
                TtlNbOfPmts: '0'
              }
            }
          }
        }
      }
    }
  };

  if (transaction.cvv) {
    requestObject.Document.AccptrAuthstnReq.AuthstnReq.Envt.Card.PlainCardData.CardSctyCd = {
      CSCVal: transaction.cvv
    };
  }

  return xmlBuilder.buildObject(requestObject);
}

function authorizeRequest() {

  var transaction = {
    softDescriptor: 'hahaha',
    poiId: '1',
    PAN: '9043423529300000',
    expirationDate: '2018-05',
    cardholderName: 'JOAO',
    metaId: '1',
    capture: true,
    saleAffiliationKey: '8E51DE32849943389B67EC5E8AD7C721',
    amount: 5000
  };
  var requestBody = createAuthorizeRequest(transaction);

  // perform POST request
  var requestOptions = {
    body: requestBody,
    headers: {
      'Content-Type': 'application/xml'
    },
    timeout: TIMEOUT,
    method: 'POST',
    url: ENDPOINT + '/AUTHORIZE'
  };
  request.post(requestOptions, function _request(err, httpResponse, body) {
    if (err) {
      console.log(err);
      return;
    }

    console.log(body);
  });
};

function createCaptureRequest(transaction) {

  var requestObject = {
    Document: {
      $: {
        xmlns: 'urn:AcceptorCompletionAdviceV02.1'
      },
      AccptrCmpltnAdvc: {
        Hdr: {
          MsgFctn: 'CMPV',
          PrtcolVrsn: '2.0'
        },
        CmpltnAdvc: {
          Envt: {
            Mrchnt: {
              Id: {
                Id: transaction.saleAffiliationKey
              }
            }
          },
          Tx: {
            InitrTxId: transaction.metaId,
            TxId: {
              TxDtTm: (new Date()).toISOString().substr(0, 19),
              TxRef: transaction.metaId
            },
            OrgnlTx: {
              RcptTxId: transaction.id
            },
            TxDtls: {
              Ccy: '986',
              TtlAmt: transaction.amount
            }
          }
        }
      }
    }
  };

  return xmlBuilder.buildObject(requestObject);
}

function captureRequest() {

  var transaction = {
    saleAffiliationKey: '8E51DE32849943389B67EC5E8AD7C721',
    id: '23',
    amount: 5000
  };
  var requestBody = createCaptureRequest(transaction);

  // perform POST request
  var requestOptions = {
    body: requestBody,
    headers: {
      'Content-Type': 'application/xml'
    },
    timeout: TIMEOUT,
    method: 'POST',
    url: ENDPOINT + '/COMPLETIONADVICE'
  };
  request.post(requestOptions, function _request(err, httpResponse, body) {
    if (err) {
      console.log(err);
      return;
    }

    console.log(body);
  });
};

function createCancelRequest(transaction) {

  var requestObject = {
    Document: {
      $: {
        xmlns: 'urn:AcceptorCancellationRequestV02.1'
      },
      AccptrCxlReq: {
        Hdr: {
          MsgFctn: 'CCAQ',
          PrtcolVrsn: '2.0'
        },
        CxlReq: {
          Envt: {
            Mrchnt: {
              Id: {
                Id: transaction.saleAffiliationKey
              }
            },
            POI: {
              Id: {
                Id: transaction.metaId
              }
            }
          },
          Tx: {
            TxCaptr: (transaction.capture ? 'true' : 'false'),
            TxId: {
              TxDtTm: (new Date()).toISOString().substr(0, 19),
              TxRef: transaction.metaId
            },
            TxDtls: {
              Ccy: '986',
              TtlAmt: transaction.amount
            },
            OrgnlTx: {
              InitrTxId: transaction.metaId,
              RcptTxId: transaction.id
            },
          }
        }
      }
    }
  };

  return xmlBuilder.buildObject(requestObject);
}

function cancelRequest() {

  var transaction = {
    saleAffiliationKey: '8E51DE32849943389B67EC5E8AD7C721',
    capture: true,
    id: '27',
    metaId: '1',
    amount: 5000
  };
  var requestBody = createCancelRequest(transaction);

  // perform POST request
  var requestOptions = {
    body: requestBody,
    headers: {
      'Content-Type': 'application/xml'
    },
    timeout: TIMEOUT,
    method: 'POST',
    url: ENDPOINT + '/CANCELLATION'
  };
  request.post(requestOptions, function _request(err, httpResponse, body) {
    if (err) {
      console.log(err);
      return;
    }

    console.log(body);
  });
};

function createCheckRequest(transaction) {

  var requestObject = {
    Document: {
      $: {
        xmlns: 'urn:AcceptorTransactionStatusReportRequestV02.1'
      },
      AccptrTxStsRptRq: {
        Hdr: {
          MsgFctn: 'TSRR',
          PrtcolVrsn: '2.0',
          InitgPty: {
            Id: transaction.saleAffiliationKey
          }
        },
        TxStsRpt: {
          Tx: {
            TxRpt: ['OPRS', 'SUMM'],
            OrgnlTx: {
              InitrTxId: transaction.metaId,
              RcptTxId: transaction.id
            },
          }
        }
      }
    }
  };

  return xmlBuilder.buildObject(requestObject);
}

function checkRequest() {

  var transaction = {
    saleAffiliationKey: '8E51DE32849943389B67EC5E8AD7C721',
    id: '23',
    metaId: '1',
  };
  var requestBody = createCheckRequest(transaction);

  // perform POST request
  var requestOptions = {
    body: requestBody,
    headers: {
      'Content-Type': 'application/xml'
    },
    timeout: TIMEOUT,
    method: 'POST',
    url: ENDPOINT + '/TransactionStatusReport'
  };
  request.post(requestOptions, function _request(err, httpResponse, body) {
    if (err) {
      console.log(err);
      return;
    }

    console.log(body);
  });
};

checkRequest();

