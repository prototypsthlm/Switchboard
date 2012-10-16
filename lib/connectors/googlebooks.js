/**
    Connector for Google Books.

    API used: The Google Books API.
    Retrieves data related to books, magazines etc.
    
    @module Connectors
    @resources: https://developers.google.com/books/docs/v1/using
**/

var util = require('util');
var BaseConnector = require('./base_connector.js');
var querystring = require('querystring');
var keys = require('./keys');

var volumeOuts = ['items.id','items.volumeInfo.publisher','items.volumeInfo.title','items.volumeInfo.authors'];
var apiActions = {
    // https://www.googleapis.com/books/v1/volumes?q=flowers+inauthor:herpderp&key=yourAPIKey
    "volumesSearch" : { action: ['volumes','search'], in_param_names: ['q'], output_nodes: volumeOuts, 
        optionals: [
                { paramName: 'download', paramValues: ['epub'] },
                { paramName: 'filtering', paramValues: ['partial','full', 'free-ebooks', 'paid-ebooks', 'ebooks'] },
                 'startIndex', 'maxResults', 
                { paramName: "printType", paramValues: ["all","books","magazines"] }, 
                { paramName: "orderBy", paramValues: ['relevance','newest'] }, 
                { paramName: "projection", paramValues: ['full','lite'] }, 
                { paramName: "q scope", paramValues: ['intitle','inauthor','inpublisher','subject','isbn'] } 
            ] },
    // https://www.googleapis.com/books/v1/volumes/volumeId
    "volumesLookup" : { action: ['volumes','lookup'], in_param_names: ['volumeID'], output_nodes: volumeOuts }
};

/**
The Google Books Connector inherits the BaseConnector and handles requests to the Google Books API.

@class GoogleBooks 
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

function GoogleBooks() {
    this.name = "Google Books";
	this.host = "https://www.googleapis.com/books/v1/";
	this.apiKey = keys[this.name]['key'];
	this.apiActions = apiActions;
	this.docs = "https://developers.google.com/books/docs/v1/using";
}

util.inherits(GoogleBooks, BaseConnector);

/**
Builds a URL for the Google Books Connector based on an API-configuration from a machine routine.

@method GoogleBooks.prototype.getActionUrl
@param {String} query Actual query string
@param {Object} apiConfig Object containing API-configuration data from the machine routine such as API-method
@return {String} Returns a URL to corresponding to inputted query and apiConfig

*/

GoogleBooks.prototype.getActionUrl = function(query, apiConfig){
     
    var apiAction = apiActions[apiConfig.action];    
    var domain = apiAction.action[0]; //t ex "artist"
    var action = apiAction.action[1];
     
    var parameterObject = {};
    parameterObject['key'] = this.apiKey;
    var actionPath;
    if(action == 'search'){
        parameterObject[apiConfig.in_param_name] = query;
        for(var param in apiConfig.optionals){
            if(apiConfig.optionals[param].paramName == "q scope")
                parameterObject[apiConfig.in_param_name] = apiConfig.optionals[param].paramValue + ":" + query;
            else
                parameterObject[apiConfig.optionals[param].paramName] = apiConfig.optionals[param].paramValue;
        }        
        actionPath = domain + "?" + querystring.stringify(parameterObject);
    }
    else {
        actionPath = domain + "/" + query + "?" + querystring.stringify(parameterObject);
    }
    
    console.log(actionPath);
    
    
    return this.host + actionPath
}

module.exports = GoogleBooks;
