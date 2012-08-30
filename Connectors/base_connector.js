var request = require('request');
var async = require("async");

function BaseConnector(param) {
    //this.name;
	this.host = param.host;
	this.responseObject;
}


BaseConnector.prototype.execute = function(queries, api_domain, cb) {
    console.log(this.name + " EXECUTE");
    var self = this;
    self.responseObject = [];
    
    async.forEach(queries, function getResults(query, done) {
        var url = self.getActionUrl(query, api_domain);
        console.log('preparing request to ' + url);
        self.get(url, query, api_domain, done); 
    },
    function(err){
        cb(self.responseObject);
    });
}
BaseConnector.prototype.get = function(url, query, domain, done) {
    var self = this;
    request(url, function (error, response, result) {
      if (!error && response.statusCode == 200) {
        console.log("successful HTTP-request");
        self.responseObject.push({query: query, api_method: domain, result: JSON.parse(result)});
      }
      done();
    });
}
module.exports = BaseConnector;
