'use strict';
var express = require('express');
var path = require('path');
var util = require(path.join(__dirname, '..', 'util.js'));
var router = express.Router();
router.post('/', function (req, res) {
  util.xmlParser.parseString(req.body, function (err, result) {
    console.log(req.body);
    if (err) {
      console.log(err);
      return res.sendStatus(500);
    }

    console.log(result);
    res.send('yay');
  });
});

module.exports = router;
