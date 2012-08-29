var request = require('request');

function BaseConnector(param) {
	this.host = param.host;
	this.responseObject;
}

BaseConnector.prototype.get = function(url, query, domain, done) {
    var self = this;
    request(url, function (error, response, result) {
      if (!error && response.statusCode == 200) {
        console.log("successful HTTP-request");
        self.responseObject.push({query: query, key: domain, result: JSON.parse(result)});
      }
      done();
    });
}

BaseConnector.prototype.execute = function(queries, domain, cb) {
    console.log("NOT IMPLEMENTED!");
}

module.exports = BaseConnector;
