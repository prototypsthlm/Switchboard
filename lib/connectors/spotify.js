/**
    Connector for Spotify.

    API used: The web API for Spotify.
    Retrieves data about artists, tracks and albums.
    
    @module Connectors
    @resources: https://developer.spotify.com/technologies/web-api/
**/

var util = require('util');
var BaseConnector = require('./base_connector.js');
var ConnectorResponse = require('./connector_response.js');
var querystring = require('querystring');

var apiActions = {
    "artistSearch" : { action: ['search','artist'], in_param_names: ['q'], output_nodes: ['artists.href','artists.name'], optionals: [ 'page' ] },
    "albumSearch" : { action: ['search','album'], in_param_names: ['q'], output_nodes: ['albums.href','albums.name','albums.artists.href','albums.artists.name'], optionals: ['page'] },
    "trackSearch" : { action: ['search','track'], in_param_names: ['q'], output_nodes: ['tracks.href','tracks.name','tracks.album.name','tracks.album.href','tracks.artists.href','tracks.artists.name'], optionals: ['page'] },
    "artistLookup" : { action: ['lookup','artist'], in_param_names: ['uri'], output_nodes: ['artist.albums.album.name','artist.albums.album.href'], optionals: [ { paramName : "extras", paramValues: ['album','albumdetail'] } ] },
    "albumLookup" : { action: ['lookup','album'], in_param_names: ['uri'], output_nodes: ['album.name','album.tracks.href','album.tracks.name'], optionals: [ { paramName : "extras", paramValues: ['track','trackdetail'] } ] },
    "trackLookup" : { action: ['lookup','track'], in_param_names: ['uri'], output_nodes: ['track.href','track.name','track.album.name','track.album.href'] }
};

/**
The Spotify Connector inherits the BaseConnector and handles requests to the Spotify API.

@class Spotify 
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

function Spotify() {
    this.name = "Spotify";
	this.host = "http://ws.spotify.com";
	this.apiActions = apiActions;
	this.apiKey = "None Required";
	this.docs = "https://developer.spotify.com/technologies/web-api/"
}

util.inherits(Spotify, BaseConnector);

/**
Builds a URL for the Spotify Connector based on an API-configuration from a machine routine.

@method Spotify.prototype.getActionUrl
@param {String} query Actual query string
@param {Object} apiConfig Object containing API-configuration data from the machine routine such as API-method
@return {String} Returns a URL to corresponding to inputted query and apiConfig

*/

Spotify.prototype.getActionUrl = function(query, apiConfig){

    var apiAction = apiActions[apiConfig.action];
    var baseAction = apiAction.action[0];
    var searchDomain = apiAction.action[1];
    var actionPath;
    var parameterObject = {};
    parameterObject[apiConfig.in_param_name] = query;        
    
    switch(baseAction)
    {
    case 'search':
        actionPath = '/search/1/'+searchDomain+'.json?'
        break;
    case 'lookup':
        actionPath = '/lookup/1/.json?'
        break;
    }      
    
    for(var param in apiConfig.optionals){
        parameterObject[apiConfig.optionals[param].paramName] = apiConfig.optionals[param].paramValue; 
    }
    
    return this.host + actionPath + querystring.stringify(parameterObject);
}

/**
Modifies the result, cleaning away API-response meta data from the original call.

@method Spotify.prototype.connectorResult
@param {Object} resultObject Result object as defined by the BaseConnector. Includes, among other things, the result returned by the API.
@return {ConnectorResponse} Returns a new ConnectorResponse instance

*/

Spotify.prototype.connectorResult = function(resultObject) {
    var connectorResponse =  new ConnectorResponse(resultObject);
    if("info" in connectorResponse.result) {
        delete connectorResponse.result["info"];
    }
    return connectorResponse;
}

module.exports = Spotify;

