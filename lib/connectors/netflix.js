/**
    Connector for Netflix.

    API used: The web API for Netflix.
    Retrieves data from the AMERICAN media catalog.
    
    @module Connectors
    @resources: api-public.netflix.com
**/

var util = require('util');
var BaseConnector = require('./base_connector.js');
var ConnectorResponse = require('./connector_response.js');
var querystring = require('querystring');
var nodeflix = require('nodeflix');
var keys = require('./keys');
var async = require("async");
var logger = require('../sb_tracer.js')();

var apiActions = {
    "catalogSearch" : { action: ['catalog','titles'], in_param_names: ['term'], output_nodes: ['catalog_titles.catalog_title.title.regular'], optionals: [] },  
};

/**
The Netflix Connector inherits the BaseConnector and utilises Nodeflix https://github.com/iamleppert/nodeflix

@class Netflix 
@constructor

*/

/**
The name of the API.
@property name
@type {String}
*/
/**
The base URL of the API.
@property host
@type {String}
*/
/**
The API-key (retrieved from keys.json)
@property apiKey
@type {String}
*/
/**
The API-secret (retrieved from keys.json)
@property apiSecret
@type {String}
*/
/**
A partial mapping of the API-methods (used by the operator)
@property apiActions
@type {Object}
*/
/**
A URL to the API documentation.
@property docs
@type {String}
*/

function Netflix() {
    this.name = "Netflix";
    this.host = "http://api-public.netflix.com";
	this.apiActions = apiActions;
	this.apiKey = keys[this.name]['key'];
	this.apiSecret = keys[this.name]['secret'];
	this.docs = "http://developer.netflix.com/docs/";
	this.nodeflix = new nodeflix({ consumer_key: this.apiKey, consumer_secret: this.apiSecret });
}

util.inherits(Netflix, BaseConnector);

/**
Very simple due to Nodeflix

@method Netflix.prototype.getActionUrl
@param {String} query Actual query string
@param {Object} apiConfig Object containing API-configuration data from the machine routine such as API-method
@return {String} Returns a URL to corresponding to inputted query and apiConfig

*/

Netflix.prototype.getActionUrl = function(query, apiConfig){
    var apiAction = apiActions[apiConfig.action];
    return "/" + apiAction.action[0] + "/" + apiAction.action[1]
}

/**
Executes one or more queries via nodeflix and returns the results.

@method Netflix.prototype.execute
@param {Object} queryData query-object containing actual query data as well as indices from previous calls
@param {Object} apiConfig A config object containing machine routine data for this call
@param {Function} cb Callback returning the results from all the async HTTP-requests

*/
Netflix.prototype.execute = function(queryData, apiConfig, cb) {
    logger.debug(this.name + " execute.");
    var self = this;
    self.responseArray = [];
    
    async.forEach(queryData, function fetchData(queryDataItem, seriesDone){
        var index = 0;
        
        async.forEach(queryDataItem.queries, function getResults(query, done) {
            //var url = self.getActionUrl(query, apiConfig);
            
            logger.trace('Preparing request to nodeflix');
            var info = queryDataItem.info[index];      
            // self.get(url, query, apiConfig, index, queryDataItem.callIndex, info.valueSourcePath, done); // replaced by nodeflix
            
            var parameterObject = {};
            parameterObject[apiConfig.in_param_name] = query;
            
            self.nodeflix.get(self.getActionUrl(query, apiConfig), parameterObject, function(result) {
                self.responseArray.push(self.connectorResult({query: query, index: index, callIndex: queryDataItem.callIndex, valueSourcePath: info.valueSourcePath, apiConfig: apiConfig, result: JSON.parse(result)}));        
                done();
            });
            index += 1;
        },
        function(err){
            seriesDone();
        });
        
    },function(err){
        cb(self.responseArray);
    });
}

module.exports = Netflix;

