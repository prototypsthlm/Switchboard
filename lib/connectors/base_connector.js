/**
A Connector works like an interface to third party API's, such as Spotify, Last.fm, Google and more.
Every connector exposes methods which can be used to make calls to those API's.
When ready a Connector should always return a ConnectorResponse object containing meta information
about the request and response and the result.

@module Connectors
**/

var request = require('request');
var async = require("async");
var ConnectorResponse = require('./connector_response.js');
var logger = require('../sb_tracer.js')();

/**
The BaseConnector should be inherited by all other Connectors.
It can be seen as a Abstract Class containing some functions
that are used by all other Connectors.
The BaseConnector executes all async requests and collects all data but
every Connector subclass is responsible for providing the right URL and param data and to
handle the response.

@class BaseConnector 
@constructor

*/

/**
Array containing ConnectorResults from GET-requests.
@property responseArray
@type {Array} queryData query-object containing actual query data as well as indices from previous calls

*/
function BaseConnector(param) {
	this.host = param.host;
	this.responseArray;
}

BaseConnector.prototype.getActionUrl = function(query, apiConfig) {
    throw NotImplementedError("getActionUrl");
}

/**
Handles JSON-results from a request and returns a new ConnectorResponse containing cloned request results as well as
meta-data.

@method BaseConnector.prototype.connectorResult
@param {Object} resultObject Object containing HTTP-request meta-data as well as a HTTP-request results
@return {ConnectorResponse} Returns a new ConnectorResponse instance

*/
BaseConnector.prototype.connectorResult = function(resultObject) {
    return new ConnectorResponse(resultObject);
}

/**
Executes one or more queries to an API and returns the results.

@method BaseConnector.prototype.execute
@param {Object} queryData query-object containing actual query data as well as indices from previous calls
@param {Object} apiConfig A config object containing machine routine data for this call
@param {Function} cb Callback returning the results from all the async HTTP-requests

*/
BaseConnector.prototype.execute = function(queryData, apiConfig, cb) {
    logger.debug(this.name + " execute.");
    var self = this;
    self.responseArray = [];
    
    async.forEach(queryData, function fetchData(queryDataItem, seriesDone){
        var index = 0;
        
        async.forEach(queryDataItem.queries, function getResults(query, done) {
            var url = self.getActionUrl(query, apiConfig);
            logger.trace('Preparing request to : ' + url);            
            self.get(url, query, apiConfig, index, queryDataItem.callIndex, queryDataItem.sourceInfo[index], done);
            index += 1;
        },
        function(err){
            seriesDone();
        });
        
    },function(err){
        cb(self.responseArray);
    });
}

/**
Performs a single GET-request and appends the data to the connector responseArray.

@method BaseConnector.prototype.get
@param {String} url The URL to GET
@param {String} query The query/in-parameter value
@param {String} apiConfig A config object containing machine routine data for this call
@param {Integer} index The index of the GET-request. Used for formatting the final result.
@param {Integer} callIndex The index of the GET-request that provided the query for this call. Used for formatting the final result.
@param {Function} done Callback indicating to the async forEach that the HTTP-request is finished.

*/
BaseConnector.prototype.get = function(url, query, apiConfig, index, callIndex, sourceInfo, done) {
    var self = this;
    request({ url: url, headers: { "Accept" : "application/json" } }, function (error, response, result) {
      if (!error && response.statusCode == 200) {
        logger.info("Successful HTTP-request : " + url);
        self.responseArray.push(self.connectorResult({query: query, index: index, callIndex: callIndex, sourceInfo: sourceInfo, apiConfig: apiConfig, result: JSON.parse(result)}));
      }
      else {
          if(response){
              //throw(new Error("HTTP-request FAILED : " + url + " : " + response.statusCode + " : " + response.body));
              logger.error("HTTP-request FAILED : " + url + " : " + response.statusCode + " : " + response.body);
          }
          else {
              throw(new Error("HTTP-request FAILED : " + url));
          }
      }
      done();
    });
}

module.exports = BaseConnector;
