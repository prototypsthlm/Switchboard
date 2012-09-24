var request = require('request');
var async = require("async");
var ConnectorResponse = require('./connector_response.js');
/**
    inherited by all connectors.
    implements methods for doiing async HTTP-requests to APIs and sending the results back to the switchboard engine
    the url to send GETs to is built in the subclass.
**/

function BaseConnector(param) {
    //this.name;
	this.host = param.host;
	this.responseObject;
}

BaseConnector.prototype.connectorResult = function(resultObj) {
    return new ConnectorResponse(resultObj, resultObj.result);
}

BaseConnector.prototype.execute = function(queryData, api_domain, cb) {
    console.log(this.name + " EXECUTE");
    var self = this;
    self.responseObject = [];
    
    async.forEach(queryData, function fetchData(queryDataItem, seriesDone){ //so that callIndex gets set properly
        var index = 0;
        async.forEach(queryDataItem.queries, function getResults(query, done) {
            var url = self.getActionUrl(query, api_domain);
            console.log('preparing request to ' + url);
            self.get(url, query, api_domain, index, queryDataItem.callIndex, done);
            index += 1;
        },
        function(err){
            seriesDone();
        });
        
    },function(err){
        cb(self.responseObject);
    });
}

BaseConnector.prototype.get = function(url, query, domain, index, callIndex, done) {
    var self = this;
    request({url: url, headers: { "Accept" : "application/json" }}, function (error, response, result) {
      if (!error && response.statusCode == 200) {
        console.log("successful HTTP-request : " + query);
        self.responseObject.push(self.connectorResult({query: query, index: index, callIndex: callIndex, apiConfig: domain, result: JSON.parse(result)}));
        //self.responseObject.push({query: query, index: index, callIndex: callIndex, apiConfig: domain, result: JSON.parse(result)});
      }
      else {
          console.log("HTTP-request FAILED " + response.statusCode + " : " + response.body);
      }
      done();
    });
}

module.exports = BaseConnector;
