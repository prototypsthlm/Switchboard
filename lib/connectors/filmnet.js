/**
    Connector for Filmnet.

    API used: Scraping Filmnet.
    Retrieves data related to media that can be accessed via the Filmnet service
    
    @module Connectors
    @resources: https://developers.google.com/books/docs/v1/using
**/


var request = require('request');
var logger = require('../sb_tracer.js')();
var jsdom = require("jsdom");

var path = require('path');
var fs = require("fs");
var jquery = fs.readFileSync(path.resolve(__dirname,'../jquery.js')).toString(); //difference between jquery node module and running it from file

var util = require('util');
var BaseConnector = require('./base_connector.js');
var ConnectorResponse = require('./connector_response.js');
var querystring = require('querystring');
var keys = require('./keys');
var jpath = require("node-jpath");

var apiActions = {
    "mediaSearch" : { action: ['media','search'], in_param_names: ['text'], output_nodes: ['results.title'], optionals: [] },
}

/**
The Filmnet Connector inherits the BaseConnector and handles requests for scraping Filmnet.

@class Filmnet 
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
A partial mapping of the API-methods (used by the operator)
@property apiActions
@type {Object}
*/
/**
A URL to the API documentation.
@property docs
@type {String}
*/

function Filmnet() {
    this.name = "Filmnet";
	this.host = "http://www.filmnet.se/";
	this.apiKey = keys[this.name]['key'];
	this.apiActions = apiActions;
	this.docs = "http://www.filmnet.se/";
}

util.inherits(Filmnet, BaseConnector);

/**
Builds a URL for the Filmnet Connector based on an API-configuration from a machine routine.

@method Filmnet.prototype.getActionUrl
@param {String} query Actual query string
@param {Object} apiConfig Object containing API-configuration data from the machine routine such as API-method
@return {String} Returns a URL to corresponding to inputted query and apiConfig

*/

Filmnet.prototype.getActionUrl = function(query, apiConfig){
     
    var apiAction = apiActions[apiConfig.action];    
    var domain = apiAction.action[0]; //t ex "artist"
    var action = apiAction.action[1];
     
    var parameterObject = {};
    var actionPath;
    if(action == 'search'){
        parameterObject[apiConfig.in_param_name] = query;
        for(var param in apiConfig.optionals){
            parameterObject[apiConfig.optionals[param].paramName] = apiConfig.optionals[param].paramValue;
        }        
        actionPath = action + "?" + querystring.stringify(parameterObject);
    }
    
    console.log(actionPath);
    
    return this.host + actionPath
}

/**
Performs a single GET-request and appends the data to the connector responseArray.

@method Filmnet.prototype.get
@param {String} url The URL to GET
@param {String} query The query/in-parameter value
@param {String} apiConfig A config object containing machine routine data for this call
@param {Integer} index The index of the GET-request. Used for formatting the final result.
@param {Integer} callIndex The index of the GET-request that provided the query for this call. Used for formatting the final result.
@param {String} valueSourcePath A dot notated string path pointing to the location where the query was found, e.g. events.event.1.artists where every part within dots ('.') is a key in an object
@param {Function} done Callback indicating to the async forEach that the HTTP-request is finished.

*/

Filmnet.prototype.get = function(url, query, apiConfig, index, callIndex, valueSourcePath, done) {
    var self = this;
    request({ url: url }, function (error, response, result) { //look ma, no headers!
      if (!error && response.statusCode == 200) {
        logger.info("Successful HTTP-request : " + url);
        var scrapingObject = { results: [] };
        jsdom.env( //this is async...
            {
                html: result,
                src: [jquery], 
                done: function(errors, window){
                    var $ = window.$;
                    $("div.search-results a.search-result-item").each(function(){
                        scrapingObject.results.push({ title: $(this).find('span.title').text(), info: $(this).find('span.subheading').text(), description: $(this).find('span.description').text(), poster: $(this).find('img').attr('src') })
                    });
                    self.responseArray.push(self.connectorResult({query: query, index: index, callIndex: callIndex, valueSourcePath: valueSourcePath, apiConfig: apiConfig, result: scrapingObject }));
                    done();
                }
        });
        
      }
      else {
          if(response){
             logger.error("HTTP-request FAILED : " + url + " : " + response.statusCode); // response.body contains garbage in this case
             console.log(response);
          }
          else {
              throw(new Error("HTTP-request FAILED : " + url));
          }
          done();
      }
    });
}

module.exports = Filmnet;
