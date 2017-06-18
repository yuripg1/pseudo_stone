'use strict';

var xml2js = require('xml2js');
module.exports.xmlBuilder = new xml2js.Builder({
  headless: true,
  renderOpts: {
    pretty: false,
  },
});
module.exports.xmlParser = new xml2js.Parser({
  explicitArray: true,
});
module.exports.readProperty = function readProperty(variable, keysArray) {
  var currentValue = variable;
  for (var i = 0; i < keysArray.length; i++) {
    if (typeof currentValue === 'object') {
      var nextValue = currentValue[keysArray[i]];
      if (nextValue === undefined) {
        return undefined;
      }
      currentValue = nextValue;
    } else {
      return undefined;
    }
  }
  return currentValue;
};
