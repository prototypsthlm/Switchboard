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

function Spotify(param) {
    this.name = "Spotify";
	this.host = "http://ws.spotify.com";
	this.responseObject = [];
	this.apiActions = apiActions;
	this.apiKey = "None Required";
	this.docs = "https://developer.spotify.com/technologies/web-api/"
}
util.inherits(Spotify, BaseConnector);

Spotify.prototype.connectorResult = function(resultObj) {
    var connectorResponse =  new ConnectorResponse(resultObj, resultObj.result);
    if("info" in connectorResponse.result) {
        delete connectorResponse.result["info"];
    }
    return connectorResponse;
}

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

module.exports = Spotify;

